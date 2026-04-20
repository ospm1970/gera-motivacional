import { Injectable, Logger, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAvaliacaoDto } from './dto/create-avaliacao.dto';
import { AvaliacaoEntity } from './entities/avaliacao.entity';
import { UserEntity } from '../users/entities/user.entity';

@Injectable()
export class AvaliacoesService {
  private readonly logger = new Logger(AvaliacoesService.name);
  private readonly ENCRYPTION_KEY = process.env.AVALIACAO_ENCRYPTION_KEY || '';

  constructor(
    @InjectRepository(AvaliacaoEntity)
    private readonly avaliacaoRepo: Repository<AvaliacaoEntity>,
  ) {
    if (!this.ENCRYPTION_KEY || this.ENCRYPTION_KEY.length !== 64) {
      this.logger.error('Chave de criptografia inválida ou não configurada (deve ser hex 32 bytes)');
      throw new Error('Chave de criptografia inválida ou não configurada');
    }
  }

  /**
   * Cria uma avaliação para uma frase pelo usuário autenticado
   * @param user Usuário autenticado
   * @param dto Dados da avaliação
   * @returns Avaliação criada
   * @throws BadRequestException para nota inválida
   * @throws ConflictException se avaliação já existe para user+phrase
   */
  async criarAvaliacao(user: UserEntity, dto: CreateAvaliacaoDto): Promise<AvaliacaoEntity> {
    this.logger.log({ message: 'Criando avaliação', userId: user.id, phraseId: dto.phraseId });

    if (dto.nota < 0 || dto.nota > 5) {
      throw new BadRequestException('Nota deve ser entre 0 e 5');
    }

    const existing = await this.avaliacaoRepo.findOne({ where: { user: { id: user.id }, phrase: { id: dto.phraseId } } });
    if (existing) {
      throw new ConflictException('Usuário já avaliou esta frase');
    }

    const avaliacao = this.avaliacaoRepo.create({
      nota: dto.nota,
      user,
      phrase: { id: dto.phraseId } as any,
    });

    // Criptografar dados sensíveis se houver (exemplo placeholder)
    // avaliacao.setEncryptedData(JSON.stringify({ nota: dto.nota }), this.ENCRYPTION_KEY);

    await this.avaliacaoRepo.save(avaliacao);
    this.logger.log({ message: 'Avaliação criada com sucesso', avaliacaoId: avaliacao.id });
    return avaliacao;
  }
}
