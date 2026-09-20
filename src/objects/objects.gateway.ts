import {
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { ObjectItem } from './objects.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class ObjectsGateway {
  @WebSocketServer()
  server: Server;

  emitObjectCreated(obj: ObjectItem) {
    this.server.emit('object:created', obj);
  }

  emitObjectDeleted(id: string) {
    this.server.emit('object:deleted', { id });
  }
}