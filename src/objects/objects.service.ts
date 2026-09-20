import { Injectable, NotFoundException, Logger, OnModuleInit } from '@nestjs/common';
import { S3Service } from '../config/s3.service';
import { ObjectsGateway } from './objects.gateway';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

export interface ObjectItem {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  createdAt: Date;
}

const DB_FILE = path.join(process.cwd(), 'data', 'objects.json');

@Injectable()
export class ObjectsService implements OnModuleInit {
  private readonly logger = new Logger(ObjectsService.name);
  private objects: ObjectItem[] = [];
  private useMongo = false;
  private mongoCollection: any = null;

  constructor(
    private s3Service: S3Service,
    private gateway: ObjectsGateway,
  ) {}

  async onModuleInit() {
    const mongoUri = process.env.MONGODB_URI;
    if (mongoUri) {
      try {
        const { MongoClient } = require('mongodb');
        const client = new MongoClient(mongoUri);
        await client.connect();
        const db = client.db('heyama');
        this.mongoCollection = db.collection('objects');
        this.useMongo = true;
        this.objects = await this.mongoCollection.find().sort({ createdAt: -1 }).toArray();
        this.logger.log(`MongoDB connecté — ${this.objects.length} objets chargés`);
      } catch (err) {
        this.logger.warn(`MongoDB non disponible, fallback fichier: ${err.message}`);
        this.loadFromFile();
      }
    } else {
      this.logger.log('Pas de MONGODB_URI, fallback stockage fichier');
      this.loadFromFile();
    }
  }

  private loadFromFile() {
    try {
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.objects = JSON.parse(raw);
        this.logger.log(`${this.objects.length} objets chargés depuis le fichier`);
      }
    } catch {
      this.objects = [];
    }
  }

  private saveToFile() {
    try {
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(DB_FILE, JSON.stringify(this.objects, null, 2));
    } catch (err) {
      this.logger.error(`Erreur sauvegarde fichier: ${err.message}`);
    }
  }

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

    if (this.useMongo && this.mongoCollection) {
      await this.mongoCollection.insertOne(obj);
    } else {
      this.objects.unshift(obj);
      this.saveToFile();
    }

    this.logger.log(`Objet créé: ${obj.title}`);
    this.gateway.emitObjectCreated(obj);
    return obj;
  }

  async findAll(): Promise<ObjectItem[]> {
    if (this.useMongo && this.mongoCollection) {
      return this.mongoCollection.find().sort({ createdAt: -1 }).toArray();
    }
    return [...this.objects];
  }

  async findOne(id: string): Promise<ObjectItem> {
    if (this.useMongo && this.mongoCollection) {
      const obj = await this.mongoCollection.findOne({ _id: id });
      if (!obj) throw new NotFoundException('Objet non trouvé');
      return obj;
    }
    const obj = this.objects.find((o) => o._id === id);
    if (!obj) throw new NotFoundException('Objet non trouvé');
    return obj;
  }

  async remove(id: string): Promise<void> {
    const obj = await this.findOne(id);
    await this.s3Service.delete(obj.imageUrl);

    if (this.useMongo && this.mongoCollection) {
      await this.mongoCollection.deleteOne({ _id: id });
    } else {
      this.objects = this.objects.filter((o) => o._id !== id);
      this.saveToFile();
    }

    this.logger.log(`Objet supprimé: ${obj.title}`);
    this.gateway.emitObjectDeleted(id);
  }
}