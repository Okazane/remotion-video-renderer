import sys
import os
import json
import io
import requests
from PIL import Image
import torch

# Đảm bảo UTF-8 trên Windows
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

_CLIP_MODEL = None
_CLIP_PREPROCESS = None
_CLIP_TOKENIZER = None

def load_clip():
    global _CLIP_MODEL, _CLIP_PREPROCESS, _CLIP_TOKENIZER
    if _CLIP_MODEL is None:
        import open_clip
        # ViT-B-32 nhẹ, nhanh, tối ưu cực tốt cho CPU
        _CLIP_MODEL, _, _CLIP_PREPROCESS = open_clip.create_model_and_transforms(
            'ViT-B-32-quickgelu', pretrained='openai'
        )
        _CLIP_MODEL.eval()
        _CLIP_TOKENIZER = open_clip.get_tokenizer('ViT-B-32-quickgelu')
    return _CLIP_MODEL, _CLIP_PREPROCESS, _CLIP_TOKENIZER

def rank_images(text, image_urls):
    if not image_urls:
        return []
    if len(image_urls) <= 1:
        return image_urls

    try:
        model, preprocess, tokenizer = load_clip()
        
        # 1. Download & preprocess images
        valid_images = []
        valid_urls = []
        headers = {'User-Agent': 'Mozilla/5.0'}
        
        for url in image_urls:
            try:
                resp = requests.get(url, headers=headers, timeout=6)
                if resp.status_code == 200:
                    img = Image.open(io.BytesIO(resp.content)).convert('RGB')
                    valid_images.append(preprocess(img))
                    valid_urls.append(url)
            except Exception:
                continue

        if not valid_images:
            return image_urls

        # 2. Compute embeddings
        image_tensor = torch.stack(valid_images)
        text_tensor = tokenizer([text])

        with torch.no_grad():
            image_features = model.encode_image(image_tensor)
            text_features = model.encode_text(text_tensor)

            # Normalize
            image_features /= image_features.norm(dim=-1, keepdim=True)
            text_features /= text_features.norm(dim=-1, keepdim=True)

            # Cosine similarity
            similarity = (image_features @ text_features.T).squeeze(1).tolist()

        # 3. Sort by score
        if isinstance(similarity, float):
            similarity = [similarity]
            
        ranked = sorted(zip(valid_urls, similarity), key=lambda x: x[1], reverse=True)
        return [r[0] for r in ranked]
    except Exception as e:
        # Fallback an toàn nếu lỗi mạng/model
        return image_urls

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Thiếu dữ liệu JSON"}))
        sys.exit(1)

    try:
        data = json.loads(sys.argv[1])
        prompt = data.get("prompt", "")
        urls = data.get("urls", [])
        
        ranked_urls = rank_images(prompt, urls)
        print(json.dumps({"success": True, "ranked_urls": ranked_urls}, ensure_ascii=False))
    except Exception as err:
        print(json.dumps({"success": False, "error": str(err)}, ensure_ascii=False))
