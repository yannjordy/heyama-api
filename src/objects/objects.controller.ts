import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ObjectsService } from './objects.service';
import { Response } from 'express';

@Controller('objects')
export class ObjectsController {
  constructor(private readonly objectsService: ObjectsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @Body('title') title: string,
    @Body('description') description: string,
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response,
  ) {
    try {
      if (!file) {
        return res.status(400).json({ message: 'Image requise' });
      }
      const obj = await this.objectsService.create(title, description, file);
      return res.status(201).json(obj);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  @Get()
  async findAll(@Res() res: Response) {
    const objects = await this.objectsService.findAll();
    return res.status(200).json(objects);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res: Response) {
    try {
      const obj = await this.objectsService.findOne(id);
      return res.status(200).json(obj);
    } catch (error) {
      return res.status(404).json({ message: 'Objet non trouvé' });
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Res() res: Response) {
    try {
      await this.objectsService.remove(id);
      return res.status(200).json({ message: 'Objet supprimé' });
    } catch (error) {
      return res.status(404).json({ message: 'Objet non trouvé' });
    }
  }
}