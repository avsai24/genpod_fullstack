import grpc
from concurrent import futures
import time
import sys
import os

import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

# Authenticate Gemini
genai.configure(api_key=api_key)

# Add proto-generated modules to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import chat_pb2
import chat_pb2_grpc


class ChatServiceServicer(chat_pb2_grpc.ChatServiceServicer):
    def SendMessageStream(self, request, context):
        print(f"🧠 Gemini Prompt: {request.message}")
        
        try:
            # Stream Gemini response
            model = genai.GenerativeModel("gemini-1.5-pro")
            response = model.generate_content(request.message, stream=True)

            for chunk in response:
                if chunk.text:
                    yield chat_pb2.ChatResponse(reply=chunk.text)
        
        except Exception as e:
            print("⚠️ Gemini Error:", e)
            yield chat_pb2.ChatResponse(reply="⚠️ Genpod encountered an error while processing your request.")


def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    chat_pb2_grpc.add_ChatServiceServicer_to_server(ChatServiceServicer(), server)
    server.add_insecure_port('[::]:50051')
    server.start()
    print("🚀 gRPC server is running at http://localhost:50051")
    try:
        while True:
            time.sleep(86400)
    except KeyboardInterrupt:
        server.stop(0)


if __name__ == '__main__':
    serve()