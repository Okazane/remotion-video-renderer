import sys
import os
import json
import soundfile as sf
import numpy as np

# Đảm bảo UTF-8 trên Windows
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

try:
    from vieneu import Vieneu
except ImportError:
    print(json.dumps({"success": False, "error": "Chưa cài đặt vieneu"}))
    sys.exit(1)

# Global engine cache
_ENGINE = None

def get_engine():
    global _ENGINE
    if _ENGINE is None:
        _ENGINE = Vieneu()
    return _ENGINE

def synthesize(text, voice_name="Minh Đức", output_path=""):
    try:
        engine = get_engine()
        # Chuẩn hóa tên giọng
        valid_presets = [v[1] for v in engine.list_preset_voices()]
        chosen_voice = voice_name if voice_name in valid_presets else "Minh Đức"
        
        audio = engine.infer(text=text, voice=chosen_voice)
        
        # Lưu file
        engine.save(audio, output_path)
        
        # Tính thời lượng audio
        info = sf.info(output_path)
        duration = float(info.duration)
        
        return {
            "success": True,
            "duration": round(duration, 3),
            "filePath": output_path,
            "voice": chosen_voice
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Thiếu tham số JSON"}))
        sys.exit(1)
        
    try:
        input_data = json.loads(sys.argv[1])
        text = input_data.get("text", "")
        voice = input_data.get("voice", "Minh Đức")
        output = input_data.get("output", "output.wav")
        
        result = synthesize(text, voice, output)
        print(json.dumps(result, ensure_ascii=False))
    except Exception as err:
        print(json.dumps({"success": False, "error": str(err)}, ensure_ascii=False))
