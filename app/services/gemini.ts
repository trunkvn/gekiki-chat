import {
  GoogleGenAI,
  GenerateContentResponse,
  Content,
  Part,
} from "@google/genai";
import { Message, Role } from "../types";

const SYSTEM_PROMPT = `
Bạn là một trợ lý AI đa năng, có tư duy logic, trung lập và có chiều sâu.

Mục tiêu:
- Hiểu đúng câu hỏi trước khi trả lời
- Trả lời rõ ràng, mạch lạc, đúng trọng tâm
- Điều chỉnh độ sâu theo ngữ cảnh và cách hỏi của người dùng

Nguyên tắc trả lời:
1. Nếu câu hỏi mơ hồ → hỏi lại hoặc nêu giả định trước khi trả lời
2. Nếu là kiến thức:
   - Giải thích từ gốc (first principles) khi cần
   - Dùng ví dụ thực tế để minh họa
3. Nếu là vấn đề cần phân tích:
   - Chia nhỏ vấn đề
   - So sánh các góc nhìn (ưu / nhược)
4. Nếu là tư vấn:
   - Nêu lựa chọn
   - Không áp đặt
   - Không đưa lời khuyên y tế / pháp lý chuyên môn
5. Nếu liên quan đến kỹ thuật / code:
   - Chỉ đưa code khi nó giúp làm rõ vấn đề
   - Ưu tiên best practices
   - Chỉ ra rủi ro hoặc giới hạn

Quy tắc trung thực:
- Không bịa thông tin
- Nếu không chắc → nói rõ mức độ không chắc
- Không suy đoán ý định người dùng
`;

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({
      apiKey: 'AIzaSyDkveypj9vDnKDGjiOd1oeGG0vTQlovTYs', // ❗ backend only
    });
  }

  async *streamChat(
    history: Message[],
    userInput: string,
    modelId: string = "gemini-2.5-flash",
    imageBase64?: string
  ) {
    const contents: Content[] = [
      {
        role: "model",
        parts: [{ text: SYSTEM_PROMPT }],
      },
    ];

    /** 2️⃣ History */
    for (const msg of history) {
      contents.push({
        role: msg.role === Role.USER ? "user" : "model",
        parts: [{ text: msg.content }],
      });
    }

    /** 3️⃣ User input */
    const userParts: Part[] = [{ text: userInput }];

    if (imageBase64) {
      const [meta, data] = imageBase64.split(",");
      const mimeType =
        meta.match(/data:(.*);base64/)?.[1] ?? "image/png";

      userParts.push({
        inlineData: {
          mimeType,
          data,
        },
      });
    }

    contents.push({
      role: "user",
      parts: userParts,
    });

    /** 4️⃣ Call Gemini */
    const responseStream = await this.ai.models.generateContentStream({
      model: modelId,
      contents,
      config: {
        temperature: 0.6,
        topP: 0.9,
        topK: 40,
      },
    });

    for await (const chunk of responseStream) {
      const chunkResponse = chunk as GenerateContentResponse;
      yield chunkResponse.text ?? "";
    }
  }
}

export const geminiService = new GeminiService();
