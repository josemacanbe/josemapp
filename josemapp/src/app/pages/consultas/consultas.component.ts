import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ChatbotService, ChatMessage } from '../../services/chatbot.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MarkdownModule } from 'ngx-markdown';
import { marked } from 'marked';

@Component({
  selector: 'app-consultas',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, MarkdownModule],
  templateUrl: './consultas.component.html',
  styleUrls: ['./consultas.component.css']
})
export class ConsultasComponent implements OnInit, AfterViewChecked {
  messages: ChatMessage[] = [];
  userInput: string = '';
  isLoading: boolean = false;
  @ViewChild('chatMessages') private messagesContainer!: ElementRef;

  constructor(
    private chatbotService: ChatbotService,
    private sanitizer: DomSanitizer
  ) {
    // Configuración de marked para asegurar que los enlaces se abran en una nueva pestaña
    marked.setOptions({
      breaks: true, // Permite saltos de línea automáticos
      gfm: true,    // GitHub Flavored Markdown
    });
  }

  ngOnInit(): void {
    // Inicializamos con un mensaje del sistema para establecer el contexto
    this.messages.push({
      role: 'system',
      content: 'Eres un asistente virtual útil para JoseM App, una aplicación de fichajes y dashboard para la gestión de jornadas de trabajo.'
    });
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    try {
      this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
    } catch(err) { }
  }

  // Función para formatear el texto del mensaje con soporte para Markdown
  formatMessage(content: string): SafeHtml {
    if (!content) return '';
    
    try {
      // Convertir Markdown a HTML usando marked asegurándonos de que devuelve un string
      const htmlContent = marked.parse(content) as string;
      
      // Asegurarnos de que los enlaces se abran en una nueva pestaña
      const htmlWithTargetLinks = htmlContent.replace(
        /<a /g, 
        '<a target="_blank" rel="noopener noreferrer" '
      );
      
      // Sanitizar el HTML para evitar ataques XSS
      return this.sanitizer.bypassSecurityTrustHtml(htmlWithTargetLinks);
    } catch (error) {
      console.error('Error al convertir Markdown a HTML:', error);
      // Si hay error, devolvemos el contenido original con saltos de línea básicos
      return this.sanitizer.bypassSecurityTrustHtml(content.replace(/\n/g, '<br>'));
    }
  }

  sendMessage(): void {
    if (!this.userInput.trim()) return;

    // Agregamos el mensaje del usuario con timestamp
    this.messages.push({
      role: 'user',
      content: this.userInput,
      timestamp: new Date()
    });

    const userMessage = this.userInput;
    this.userInput = '';
    this.isLoading = true;

    console.log('Enviando mensaje. Total mensajes:', this.messages.length);

    // Enviamos la conversación completa al servicio
    this.chatbotService.sendMessage([...this.messages])
      .subscribe({
        next: (response) => {
          console.log('Respuesta recibida:', response);
          if (response.choices && response.choices.length > 0) {
            // Añadir timestamp a la respuesta
            const assistantMessage = {
              ...response.choices[0].message,
              timestamp: new Date()
            };
            this.messages.push(assistantMessage);
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error al enviar mensaje:', error);
          console.error('Detalles del error:', {
            status: error.status,
            statusText: error.statusText,
            error: error.error,
            message: error.message
          });
          
          let errorMessage = 'Lo siento, ha ocurrido un error al procesar tu mensaje. Por favor, inténtalo de nuevo más tarde.';
          
          if (error.status === 0) {
            errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión a Internet o podría haber un problema de CORS.';
          } else if (error.status === 401 || error.status === 403) {
            errorMessage = 'Error de autenticación. La clave API podría ser inválida.';
          } else if (error.status === 429) {
            errorMessage = 'Se ha excedido el límite de peticiones a la API. Inténtalo más tarde.';
          } else if (error.error && error.error.message) {
            errorMessage = `Error: ${error.error.message}`;
          }
          
          this.messages.push({
            role: 'assistant',
            content: errorMessage,
            timestamp: new Date()
          });
          this.isLoading = false;
        }
      });
  }
}
