import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import * as mammoth from 'mammoth';
const pdfParse = require('pdf-parse');
import { PrismaService } from '../../database/prisma.service';
import { ChatService } from '../chat/chat.service';

@Processor('document-review-queue')
export class ReviewProcessor extends WorkerHost {
  private readonly logger = new Logger(ReviewProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly chatService: ChatService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { reviewId, fileBase64, fileName } = job.data;
    
    this.logger.log(`Processing review job for Document ${reviewId}`);

    try {
      // 1. Update status to processing
      await this.prisma.documentReview.update({
        where: { id: reviewId },
        data: { status: 'processing' },
      });

      // 2. Extract Text
      const fileBuffer = Buffer.from(fileBase64, 'base64');
      let extractedText = '';

      if (fileName.toLowerCase().endsWith('.pdf')) {
        const parsed = await pdfParse(fileBuffer);
        extractedText = parsed.text;
      } else if (fileName.toLowerCase().endsWith('.docx')) {
        const parsed = await mammoth.extractRawText({ buffer: fileBuffer });
        extractedText = parsed.value;
      } else {
        throw new Error('Unsupported file format for text extraction');
      }

      // Limit extracted text to max tokens (approx 15000 chars for Ollama context safety)
      const safeTextLength = 15000;
      const truncatedText = extractedText.substring(0, safeTextLength);

      // 3. Prompt Ollama for Analysis
      const prompt = `Anda adalah Legal Auditor expert. Lakukan review terhadap dokumen hukum berikut. Berikan output HANYA dalam format JSON dengan struktur: 
{
  "riskScore": (angka 0-100),
  "missingClauses": ["klausul 1", "klausul 2"],
  "riskyClauses": ["risiko 1", "risiko 2"],
  "recommendation": "saran perbaikan"
}

Teks Dokumen:
---
${truncatedText}
---`;

      // Simulating AI call via ChatService generate logic
      // In production, we'd call Ollama via ChatService.
      // Since it's a queue processing locally, we wait for Ollama response.
      const aiResponse = await this.chatService.generateDirectMessage(prompt);
      
      let parsedJson: any = null;
      try {
        // Simple extraction of JSON from response
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedJson = JSON.parse(jsonMatch[0]);
        } else {
          // Fallback parsing
          parsedJson = JSON.parse(aiResponse);
        }
      } catch (e) {
        this.logger.error(`Failed to parse AI JSON response: ${aiResponse}`);
        throw new Error('AI produced invalid JSON output');
      }

      // 4. Save Results
      await this.prisma.documentReview.update({
        where: { id: reviewId },
        data: {
          status: 'completed',
          extractedText: truncatedText,
          riskScore: parsedJson.riskScore ?? 50,
          analysisResult: parsedJson,
        },
      });

      this.logger.log(`Successfully completed review job for Document ${reviewId}`);
    } catch (error: any) {
      this.logger.error(`Error processing review ${reviewId}: ${error.message}`);
      await this.prisma.documentReview.update({
        where: { id: reviewId },
        data: {
          status: 'failed',
          errorMessage: error.message,
        },
      });
      throw error;
    }
  }
}
