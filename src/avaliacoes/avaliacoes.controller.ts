import { Controller, Post, Body, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { AvaliacoesService } from './avaliacoes.service';
import { CreateAvaliacaoDto } from './dto/create-avaliacao.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('avaliacoes')
export class AvaliacoesController {
  constructor(private readonly avaliacoesService: AvaliacoesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async criarAvaliacao(@Req() req: Request, @Body() dto: CreateAvaliacaoDto) {
    const user = req.user;
    const avaliacao = await this.avaliacoesService.criarAvaliacao(user, dto);
    return { message: 'Avaliação submetida com sucesso', avaliacaoId: avaliacao.id };
  }
}
