import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class TeamsService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserTeams(userId: string) {
    return this.prisma.team.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } }
        ]
      },
      include: {
        members: { include: { user: { select: { id: true, fullName: true, email: true } } } },
        invitations: { where: { status: 'pending' } }
      }
    });
  }

  async createTeam(userId: string, name: string) {
    return this.prisma.team.create({
      data: {
        name,
        ownerId: userId,
        members: {
          create: {
            userId,
            role: 'owner',
          }
        }
      }
    });
  }

  async getTeamMembers(teamId: string, userId: string) {
    // Check if user is in team
    const membership = await this.prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } }
    });

    if (!membership && !(await this.isTeamOwner(teamId, userId))) {
      throw new ForbiddenException('Not a member of this team');
    }

    return this.prisma.teamMember.findMany({
      where: { teamId },
      include: { user: { select: { id: true, fullName: true, email: true } } }
    });
  }

  async inviteMember(teamId: string, inviterId: string, email: string, role: string) {
    const isOwnerOrAdmin = await this.prisma.teamMember.findFirst({
      where: { teamId, userId: inviterId, role: { in: ['owner', 'admin'] } }
    });

    if (!isOwnerOrAdmin) throw new ForbiddenException('Only admins can invite');

    const checkUser = await this.prisma.user.findUnique({ where: { email } });
    if (checkUser) {
      const existingMembership = await this.prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId, userId: checkUser.id } }
      });
      if (existingMembership) throw new BadRequestException('User is already in team');
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    // Save invitation
    const invitation = await this.prisma.teamInvitation.create({
      data: {
        teamId,
        invitedBy: inviterId,
        email,
        role,
        token,
        expiresAt,
      }
    });

    // Normally would send email here, we just return the link for UI logic
    return {
      message: 'Invitation generated',
      invitation,
      link: `/invitation?token=${token}`
    };
  }

  async acceptInvitation(userId: string, token: string) {
    const invitation = await this.prisma.teamInvitation.findUnique({
      where: { token, status: 'pending' },
      include: { team: true }
    });

    if (!invitation) throw new NotFoundException('Invitation invalid or expired');
    if (invitation.expiresAt < new Date()) throw new BadRequestException('Invitation expired');

    // Make sure the accepting user matches the email? 
    // Wait, let's keep it simple: if you have the token, you can claim it as long as the system ties it to your login.
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.email !== invitation.email) {
      throw new ForbiddenException('Invitation was sent to another email');
    }

    // Process accept
    await this.prisma.$transaction([
      this.prisma.teamMember.create({
        data: {
          teamId: invitation.teamId,
          userId,
          role: invitation.role,
        }
      }),
      this.prisma.teamInvitation.update({
        where: { id: invitation.id },
        data: { status: 'accepted' }
      })
    ]);

    return { message: 'Successfully joined team', teamId: invitation.teamId };
  }

  async removeMember(teamId: string, removerId: string, memberUserId: string) {
    const isOwnerOrAdmin = await this.prisma.teamMember.findFirst({
      where: { teamId, userId: removerId, role: { in: ['owner', 'admin'] } }
    });

    if (!isOwnerOrAdmin) throw new ForbiddenException('Only admins can remove members');
    if (memberUserId === removerId) throw new BadRequestException('Cannot remove yourself (use leave instead)');

    const targetMembership = await this.prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: memberUserId } }
    });

    if (!targetMembership) throw new NotFoundException('Member not found');
    if (targetMembership.role === 'owner') throw new BadRequestException('Cannot remove the team owner');

    await this.prisma.teamMember.delete({
      where: { teamId_userId: { teamId, userId: memberUserId } }
    });

    return { message: 'Member removed successfully' };
  }

  private async isTeamOwner(teamId: string, userId: string) {
    const team = await this.prisma.team.findUnique({ where: { id: teamId } });
    return team?.ownerId === userId;
  }
}
