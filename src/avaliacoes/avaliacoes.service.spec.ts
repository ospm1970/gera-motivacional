import { Test, TestingModule } from '@nestjs/testing';
import { AvaliacoesService } from './avaliacoes.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AvaliacaoEntity } from './entities/avaliacao.entity';
import { Repository } from 'typeorm';
import { UserEntity } from '../users/entities/user.entity';
import { BadRequestException, ConflictException } from '@nestjs/common';

describe('AvaliacoesService', () => {
  let service: AvaliacoesService;
  let repo: jest.Mocked<Repository<AvaliacaoEntity>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvaliacoesService,
        {
          provide: getRepositoryToken(AvaliacaoEntity),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn()
          }
        }
      ]
    }).compile();

    service = module.get<AvaliacoesService>(AvaliacoesService);
    repo = module.get(getRepositoryToken(AvaliacaoEntity));

    process.env.AVALIACAO_ENCRYPTION_KEY = 'a'.repeat(64); // chave hex 32 bytes
  });

  it('deve criar avaliação com nota válida', async () => {
    const user = { id: 'user-1' } as UserEntity;
    const dto = { phraseId: 'phrase-1', nota: 4.5 };
    repo.findOne.mockResolvedValue(null);
    repo.create.mockReturnValue({ id: 'avaliacao-1', nota: 4.5, user, phrase: { id: 'phrase-1' } } as AvaliacaoEntity);
    repo.save.mockResolvedValue({ id: 'avaliacao-1', nota: 4.5, user, phrase: { id: 'phrase-1' } } as AvaliacaoEntity);

    const result = await service.criarAvaliacao(user, dto);

    expect(repo.findOne).toHaveBeenCalledWith({ where: { user: { id: user.id }, phrase: { id: dto.phraseId } } });
    expect(repo.create).toHaveBeenCalledWith({ nota: dto.nota, user, phrase: { id: dto.phraseId } });
    expect(repo.save).toHaveBeenCalled();
    expect(result.id).toBe('avaliacao-1');
  });

  it('deve rejeitar nota menor que 0', async () => {
    const user = { id: 'user-1' } as UserEntity;
    const dto = { phraseId: 'phrase-1', nota: -1 };
    await expect(service.criarAvaliacao(user, dto)).rejects.toThrow(BadRequestException);
  });

  it('deve rejeitar nota maior que 5', async () => {
    const user = { id: 'user-1' } as UserEntity;
    const dto = { phraseId: 'phrase-1', nota: 5.1 };
    await expect(service.criarAvaliacao(user, dto)).rejects.toThrow(BadRequestException);
  });

  it('deve rejeitar avaliação duplicada', async () => {
    const user = { id: 'user-1' } as UserEntity;
    const dto = { phraseId: 'phrase-1', nota: 3 };
    repo.findOne.mockResolvedValue({ id: 'avaliacao-existente' } as AvaliacaoEntity);
    await expect(service.criarAvaliacao(user, dto)).rejects.toThrow(ConflictException);
  });
});
