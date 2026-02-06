import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
}

export interface ChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
  constructor(private http: HttpClient) { }

  // Función para limitar el historial de mensajes para evitar superar el límite de tokens
  private prepareMessages(messages: ChatMessage[]): ChatMessage[] {
    // Siempre mantenemos el mensaje del sistema y los últimos 10 mensajes
    if (messages.length <= 10) {
      return messages;
    }

    // Mantenemos el mensaje del sistema (índice 0) y los últimos 9 mensajes
    return [
      messages[0],
      ...messages.slice(messages.length - 9)
    ];
  }

  sendMessage(messages: ChatMessage[]): Observable<ChatResponse> {
    // Preparamos los mensajes para evitar superar el límite de tokens
    const limitedMessages = this.prepareMessages(messages);

    const data: ChatRequest = {
      // El modelo y la API key se resuelven en el BFF (no se exponen en cliente)
      model: '',
      messages: limitedMessages,
      temperature: 0.7
    };

    return this.http.post<ChatResponse>('/bff/deepseek/chat/completions', data, { withCredentials: true })
      .pipe(
        catchError(error => {
          console.error('Error en la API de DeepSeek:', error);
          return throwError(() => error);
        })
      );
  }
}
