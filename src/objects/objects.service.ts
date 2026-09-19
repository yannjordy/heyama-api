import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { S3Service } from '../config/s3.service';
import { ObjectsGateway } from './objects.gateway';
import { v4 as uuidv4 } from 'uuid';

export interface ObjectItem {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  createdAt: Date;
}

@Injectable()
export class ObjectsService {
  private readonly logger = new Logger(ObjectsService.name);
  private objects: ObjectItem[] = [];

  constructor(
    private s3Service: S3Service,
    private gateway: ObjectsGateway,
  ) {}

  async create(
    title: string,
    description: string,
    file: Express.Multer.File,
  ): Promise<ObjectItem> {
    const imageUrl = await this.s3Service.upload(file);

    const obj: ObjectItem = {
      _id: uuidv4(),
      title,
      description,
      imageUrl,
      createdAt: new Date(),
    };

    this.objects.unshift(obj);
    this.logger.log(`Object created: ${obj.title}`);
    this.gateway.emitObjectCreated(obj);

    return obj;
  }

  async findAll(): Promise<ObjectItem[]> {
    return [...this.objects];
  }

  async findOne(id: string): Promise<ObjectItem> {
    const obj = this.objects.find((o) => o._id === id);
    if (!obj) throw new NotFoundException('Objet non trouvé');
    return obj;
  }

  async remove(id: string): Promise<void> {
    const obj = await this.findOne(id);
    await this.s3Service.delete(obj.imageUrl);
    this.objects = this.objects.filter((o) => o._id !== id);
    this.logger.log(`Object deleted: ${obj.title}`);
    this.gateway.emitObjectDeleted(id);
  }
}