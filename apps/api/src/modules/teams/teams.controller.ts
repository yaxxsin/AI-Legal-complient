import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TeamsService } from './teams.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('teams')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all teams for the current user' })
  getUserTeams(@Req() req: any) {
    return this.teamsService.getUserTeams(req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new team' })
  createTeam(@Req() req: any, @Body('name') name: string) {
    return this.teamsService.createTeam(req.user.id, name);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Get members of a team' })
  getTeamMembers(@Param('id') teamId: string, @Req() req: any) {
    return this.teamsService.getTeamMembers(teamId, req.user.id);
  }

  @Post(':id/invitations')
  @ApiOperation({ summary: 'Invite a member to the team' })
  inviteMember(
    @Param('id') teamId: string, 
    @Req() req: any,
    @Body() dto: { email: string; role: string }
  ) {
    return this.teamsService.inviteMember(teamId, req.user.id, dto.email, dto.role);
  }

  @Post('invitations/accept')
  @ApiOperation({ summary: 'Accept a team invitation token' })
  acceptInvitation(@Req() req: any, @Body('token') token: string) {
    return this.teamsService.acceptInvitation(req.user.id, token);
  }

  @Delete(':id/members/:userId')
  @ApiOperation({ summary: 'Remove a member from the team' })
  removeMember(@Param('id') teamId: string, @Param('userId') targetUserId: string, @Req() req: any) {
    return this.teamsService.removeMember(teamId, req.user.id, targetUserId);
  }
}
