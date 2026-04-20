import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, Index, CreateDateColumn } from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { PhraseEntity } from '../../phrases/entities/phrase.entity';
import * as crypto from 'crypto';

@Entity('avaliacoes')
@Index(['user', 'phrase'], { unique: true })
export class AvaliacaoEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('float')
  nota: number;

  @ManyToOne(() => UserEntity, user => user.avaliacoes, { eager: false, nullable: false })
  user: UserEntity;

  @ManyToOne(() => PhraseEntity, phrase => phrase.avaliacoes, { eager: false, nullable: false })
  phrase: PhraseEntity;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'bytea', nullable: true })
  encryptedData?: Buffer;

  setEncryptedData(plainData: string, encryptionKey: string) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(encryptionKey, 'hex'), iv);
    let encrypted = cipher.update(plainData);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    this.encryptedData = Buffer.concat([iv, encrypted]);
  }

  getDecryptedData(encryptionKey: string): string | null {
    if (!this.encryptedData) return null;
    const iv = this.encryptedData.slice(0, 16);
    const encryptedText = this.encryptedData.slice(16);
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(encryptionKey, 'hex'), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  }
}
