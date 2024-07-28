import { ErrorHandler, Injectable } from '@angular/core';

@Injectable()
export class GlobalErrorHandle implements ErrorHandler {
  handleError(error: any): void {
    if (error instanceof Event) {
      console.error('Global Error Handler (WebSocket):', error);
      // Handle WebSocket error here
    } else {
      console.error('Global Error Handler:', error);
      // Handle other types of errors here
    }
  }
}
