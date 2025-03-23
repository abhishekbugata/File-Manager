import sys
import json
from transformers import AutoTokenizer, AutoModelForCausalLM
import torch

model_name = "google/gemma-3-1b"  # Hypothetical model
tokenizer = AutoTokenizer.from_pretrained(model_name, token="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")
model = AutoModelForCausalLM.from_pretrained(
    model_name,
    torch_dtype=torch.float16,
    device_map="cpu",
    token="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"
)

def process_query(content, query):
    max_length = 1500
    content = content[:max_length]
    is_question = '?' in query or query.lower().startswith(('what', 'where', 'when', 'why', 'how', 'who'))
    if not is_question:
        contains_word = query.lower() in content.lower()
        prompt = f"Given this text: '{content}', provide a short summary if it contains the word '{query}'."
        inputs = tokenizer(prompt, return_tensors="pt").to("cpu")
        outputs = model.generate(**inputs, max_new_tokens=100, temperature=0.7)
        response = tokenizer.decode(outputs[0], skip_special_tokens=True)
        summary = response.split("summary:")[-1] if "summary:" in response else "Match found" if contains_word else ""
        return {"contains_word": contains_word, "answer": None, "preview": summary}
    else:
        prompt = f"Based on this text: '{content}', answer the question: '{query}'"
        inputs = tokenizer(prompt, return_tensors="pt").to("cpu")
        outputs = model.generate(**inputs, max_new_tokens=150, temperature=0.7)
        response = tokenizer.decode(outputs[0], skip_special_tokens=True)
        answer = response.split(query)[-1].strip() if query in response else response
        return {"contains_word": False, "answer": answer, "preview": content[:100] + "..." if len(content) > 100 else content}

if __name__ == "__main__":
    data = json.loads(sys.stdin.read())
    file_path = data["file_path"]
    content = data["content"]
    query = data["query"]
    result = process_query(content, query)
    result["file_path"] = file_path
    print(json.dumps(result))