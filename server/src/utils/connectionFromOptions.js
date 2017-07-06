import type {IConnection} from 'vscode-languageserver';

import {
  IPCMessageReader,
  IPCMessageWriter,
} from 'vscode-jsonrpc';
import {createConnection} from 'vscode-languageserver';

import net from 'net';
import stream from 'stream';

type Options = {
  method: string,
} | {
  method: 'port',
  port: number,
} | {
  method: 'pipe',
  pipeName: string,
};

export default function connectionFromOptions(options: Options): ?IConnection {
  let reader: stream$Readable;
  let writer: stream$Writable;
  let server;

  switch (options.method) {
    case 'socket':
      // For socket connection, the message connection needs to be
      // established before the server socket starts listening.
      // Do that, and return at the end of this block.
      writer = new stream.PassThrough();
      reader = new stream.PassThrough();
      server = net
        .createServer(socket => {
          server.close();
          socket.pipe(writer);
          reader.pipe(socket);
        })
        .listen(options.port);
      break;
    case 'stdio':
      reader = process.stdin;
      writer = process.stdout;
      break;
    case 'node-ipc':
    default:
      reader = new IPCMessageReader(process);
      writer = new IPCMessageWriter(process);
      break;
  }

  return createConnection(reader, writer);
}
