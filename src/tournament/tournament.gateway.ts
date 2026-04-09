import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class TournamentGateway {
  @WebSocketServer()
  server!: Server;

  notifyTournamentStatusChange(tournamentId: string, status: string) {
    this.server.emit('tournamentStatusChanged', { tournamentId, status });
  }
}
