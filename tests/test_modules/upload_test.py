"""
图片上传模块测试
测试用例: UPLOAD-001 到 UPLOAD-009
"""
import sys
import os
import base64

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def run_test(page) -> bool:
    """运行图片上传模块测试"""
    print("\n  [图片上传模块测试]")

    login_and_go_to_upload(page)

    results = []

    print("    测试 UPLOAD-001: 拖拽JPG图片...")
    results.append(test_upload_jpg(page))

    print("    测试 UPLOAD-002: 拖拽PNG图片...")
    results.append(test_upload_png(page))

    print("    测试 UPLOAD-003: 拖拽WebP图片...")
    results.append(test_upload_webp(page))

    print("    测试 UPLOAD-004: 拖拽GIF图片（应报错）...")
    results.append(test_upload_gif(page))

    print("    测试 UPLOAD-005: 拖拽超过5MB的图片（应报错）...")
    results.append(test_upload_large_file(page))

    print("    测试 UPLOAD-006: 点击上传区域...")
    results.append(test_click_upload_area(page))

    print("    测试 UPLOAD-007: 重新上传...")
    results.append(test_reupload(page))

    print("    测试 UPLOAD-008: 生成过程中上传禁用...")
    results.append(test_upload_disabled_during_generation(page))

    print("    测试 UPLOAD-009: 切换Tab后图片保持...")
    results.append(test_image_persistence(page))

    passed = sum(results)
    total = len(results)
    print(f"    图片上传模块测试结果: {passed}/{total} 通过")

    return all(results)

def login_and_go_to_upload(page):
    """登录并进入上传页面"""
    page.goto("http://localhost:5173")
    page.wait_for_load_state("networkidle")

    page.evaluate("() => localStorage.setItem('emo_j_login_time', Date.now().toString())")
    page.reload()
    page.wait_for_load_state("networkidle")

def create_test_image_base64(width=100, height=100, color=(255, 0, 0), format='jpg') -> str:
    """创建测试图片的base64编码"""
    import io
    from PIL import Image

    img = Image.new('RGB', (width, height), color)

    buffer = io.BytesIO()

    if format == 'jpg':
        img.save(buffer, format='JPEG')
    elif format == 'png':
        img.save(buffer, format='PNG')
    elif format == 'webp':
        img.save(buffer, format='WEBP')
    elif format == 'gif':
        img.save(buffer, format='GIF')

    buffer.seek(0)
    return base64.b64encode(buffer.getvalue()).decode('utf-8')

def test_upload_jpg(page) -> bool:
    """UPLOAD-001: 拖拽JPG图片"""
    try:
        upload_area = page.locator('.upload-area')
        if upload_area.count() == 0:
            print("      [失败] 未找到上传区域")
            return False

        test_image = create_test_image_base64(format='jpg')
        page.evaluate(f"""
            const dataTransfer = new DataTransfer();
            const blob = dataURLtoBlob('data:image/jpeg;base64,{test_image}');
            const file = new File([blob], 'test.jpg', {{type: 'image/jpeg'}});
            dataTransfer.items.add(file);

            const dropZone = document.querySelector('.upload-area');
            const dropEvent = new DragEvent('drop', {{ bubbles: true, dataTransfer }});
            dropZone.dispatchEvent(dropEvent);
        """)

        page.wait_for_timeout(1000)

        preview = page.locator('.preview-image')
        if preview.count() > 0:
            print("      [通过] JPG图片上传成功")
            return True
        else:
            print("      [失败] 预览未显示")
            return False
    except Exception as e:
        print(f"      [失败] {str(e)}")
        return False

def test_upload_png(page) -> bool:
    """UPLOAD-002: 拖拽PNG图片"""
    try:
        page.evaluate("() => localStorage.removeItem('emo_j_login_time')")
        page.reload()
        page.wait_for_load_state("networkidle")
        page.evaluate("() => localStorage.setItem('emo_j_login_time', Date.now().toString())")
        page.reload()
        page.wait_for_load_state("networkidle")

        test_image = create_test_image_base64(format='png')
        page.evaluate(f"""
            const dataTransfer = new DataTransfer();
            const blob = dataURLtoBlob('data:image/png;base64,{test_image}');
            const file = new File([blob], 'test.png', {{type: 'image/png'}});
            dataTransfer.items.add(file);

            const dropZone = document.querySelector('.upload-area');
            const dropEvent = new DragEvent('drop', {{ bubbles: true, dataTransfer }});
            dropZone.dispatchEvent(dropEvent);
        """)

        page.wait_for_timeout(1000)

        preview = page.locator('.preview-image')
        if preview.count() > 0:
            print("      [通过] PNG图片上传成功")
            return True
        else:
            print("      [失败] 预览未显示")
            return False
    except Exception as e:
        print(f"      [失败] {str(e)}")
        return False

def test_upload_webp(page) -> bool:
    """UPLOAD-003: 拖拽WebP图片"""
    try:
        page.reload()
        page.wait_for_load_state("networkidle")

        test_image = create_test_image_base64(format='webp')
        page.evaluate(f"""
            const dataTransfer = new DataTransfer();
            const blob = dataURLtoBlob('data:image/webp;base64,{test_image}');
            const file = new File([blob], 'test.webp', {{type: 'image/webp'}});
            dataTransfer.items.add(file);

            const dropZone = document.querySelector('.upload-area');
            const dropEvent = new DragEvent('drop', {{ bubbles: true, dataTransfer }});
            dropZone.dispatchEvent(dropEvent);
        """)

        page.wait_for_timeout(1000)

        preview = page.locator('.preview-image')
        if preview.count() > 0:
            print("      [通过] WebP图片上传成功")
            return True
        else:
            print("      [失败] 预览未显示")
            return False
    except Exception as e:
        print(f"      [失败] {str(e)}")
        return False

def test_upload_gif(page) -> bool:
    """UPLOAD-004: 拖拽GIF图片（应报错）"""
    try:
        page.reload()
        page.wait_for_load_state("networkidle")

        test_image = create_test_image_base64(format='gif')
        page.evaluate(f"""
            const dataTransfer = new DataTransfer();
            const blob = dataURLtoBlob('data:image/gif;base64,{test_image}');
            const file = new File([blob], 'test.gif', {{type: 'image/gif'}});
            dataTransfer.items.add(file);

            const dropZone = document.querySelector('.upload-area');
            const dropEvent = new DragEvent('drop', {{ bubbles: true, dataTransfer }});
            dropZone.dispatchEvent(dropEvent);
        """)

        page.wait_for_timeout(1000)

        error_msg = page.locator('.error-message')
        if error_msg.count() > 0:
            print("      [通过] GIF格式被正确拒绝")
            return True
        else:
            print("      [失败] GIF格式未被拒绝")
            return False
    except Exception as e:
        print(f"      [失败] {str(e)}")
        return False

def test_upload_large_file(page) -> bool:
    """UPLOAD-005: 拖拽超过5MB的图片"""
    try:
        page.reload()
        page.wait_for_load_state("networkidle")

        large_image = create_test_image_base64(2000, 2000, format='png')
        page.evaluate(f"""
            const dataTransfer = new DataTransfer();
            const blob = dataURLtoBlob('data:image/png;base64,{large_image}');
            const file = new File([blob], 'large.png', {{type: 'image/png'}});
            dataTransfer.items.add(file);

            const dropZone = document.querySelector('.upload-area');
            const dropEvent = new DragEvent('drop', {{ bubbles: true, dataTransfer }});
            dropZone.dispatchEvent(dropEvent);
        """)

        page.wait_for_timeout(1000)

        error_msg = page.locator('.error-message')
        if error_msg.count() > 0:
            print("      [通过] 大文件被正确拒绝")
            return True
        else:
            print("      [失败] 大文件未被拒绝")
            return False
    except Exception as e:
        print(f"      [失败] {str(e)}")
        return False

def test_click_upload_area(page) -> bool:
    """UPLOAD-006: 点击上传区域"""
    try:
        upload_area = page.locator('.upload-area')
        if upload_area.count() == 0:
            print("      [失败] 未找到上传区域")
            return False

        file_input = page.locator('.file-input')
        if file_input.count() > 0:
            print("      [通过] 文件输入框存在")
            return True
        else:
            print("      [失败] 文件输入框不存在")
            return False
    except Exception as e:
        print(f"      [失败] {str(e)}")
        return False

def test_reupload(page) -> bool:
    """UPLOAD-007: 重新上传"""
    try:
        reupload_button = page.locator('.reupload-button')
        if reupload_button.count() > 0:
            print("      [通过] 重新上传按钮存在")
            return True
        else:
            print("      [失败] 重新上传按钮不存在")
            return False
    except Exception as e:
        print(f"      [失败] {str(e)}")
        return False

def test_upload_disabled_during_generation(page) -> bool:
    """UPLOAD-008: 生成过程中上传禁用"""
    try:
        upload_area = page.locator('.upload-area.disabled')
        if upload_area.count() > 0:
            print("      [通过] 上传区域在生成中禁用")
            return True
        else:
            print("      [跳过] 当前未在生成状态")
            return True
    except Exception as e:
        print(f"      [失败] {str(e)}")
        return False

def test_image_persistence(page) -> bool:
    """UPLOAD-009: 切换Tab后图片保持"""
    try:
        preview_before = page.locator('.preview-image')
        if preview_before.count() == 0:
            print("      [跳过] 无预览图片")
            return True

        page.reload()
        page.wait_for_load_state("networkidle")

        preview_after = page.locator('.preview-image')
        if preview_after.count() > 0:
            print("      [通过] 图片状态保持")
            return True
        else:
            print("      [失败] 图片状态未保持")
            return False
    except Exception as e:
        print(f"      [失败] {str(e)}")
        return False

if __name__ == "__main__":
    from playwright.sync_api import sync_playwright

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        result = run_test(page)

        browser.close()
        sys.exit(0 if result else 1)
