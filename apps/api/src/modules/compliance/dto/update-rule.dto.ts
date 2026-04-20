import { CreateRuleDto } from './create-rule.dto';

/** DTO for updating a compliance rule (admin) — all fields optional */
export class UpdateRuleDto implements Partial<CreateRuleDto> {
  title?: string;
  description?: string;
  categoryId?: string;
  priority?: string;
  conditions?: Record<string, unknown>;
  legalReferences?: Record<string, unknown>[];
  dueDateLogic?: Record<string, unknown>;
  guidanceText?: string;
  isPublished?: boolean;
  effectiveFrom?: string;
}
