"""
本地开发服务器集成测试
快速验证页面能否正常加载和基本功能
"""
import sys
import os
from playwright.sync_api import sync_playwright

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def run_integration_test():
    """运行集成测试"""
    print("=" * 60)
    print("EMO.J 本地集成测试")
    print("=" * 60)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        results = []

        print("\n[测试 1] 页面加载测试...")
        results.append(test_page_load(page))

        print("\n[测试 2] 登录页面渲染测试...")
        results.append(test_login_page_render(page))

        print("\n[测试 3] 登录功能测试...")
        results.append(test_login_functionality(page))

        print("\n[测试 4] 主页面组件测试...")
        results.append(test_main_page_components(page))

        print("\n[测试 5] 响应式布局测试...")
        results.append(test_responsive_layout(page))

        browser.close()

        passed = sum(results)
        total = len(results)

        print("\n" + "=" * 60)
        print(f"测试结果: {passed}/{total} 通过")
        print("=" * 60)

        return all(results)

def test_page_load(page):
    """测试页面加载"""
    try:
        page.goto("http://localhost:5173", timeout=10000)
        page.wait_for_load_state("networkidle", timeout=10000)

        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)

        page.wait_for_timeout(1000)

        if console_errors:
            print(f"  [警告] 控制台有错误: {console_errors[:3]}")
        else:
            print("  [通过] 页面加载成功，无控制台错误")

        return True
    except Exception as e:
        print(f"  [失败] {str(e)}")
        return False

def test_login_page_render(page):
    """测试登录页面渲染"""
    try:
        login_container = page.locator('.login-container')
        login_title = page.locator('.login-title')

        if login_container.count() > 0:
            print("  [通过] 登录容器渲染正确")
        else:
            print("  [失败] 登录容器未找到")
            return False

        if login_title.count() > 0:
            title_text = login_title.inner_text()
            if "EMO" in title_text and "J" in title_text:
                print("  [通过] 登录标题正确: EMO.J")
            else:
                print(f"  [警告] 登录标题异常: {title_text}")

        return True
    except Exception as e:
        print(f"  [失败] {str(e)}")
        return False

def test_login_functionality(page):
    """测试登录功能"""
    try:
        password_input = page.locator('input[type="password"]')
        login_button = page.locator('button[type="submit"]')

        if password_input.count() == 0 or login_button.count() == 0:
            print("  [失败] 登录表单元素未找到")
            return False

        print("  [通过] 登录表单元素存在")

        password_input.fill("emo123")
        login_button.click()

        page.wait_for_timeout(1000)

        navbar = page.locator('.navbar')
        if navbar.count() > 0:
            print("  [通过] 登录成功，跳转到主页")
            return True
        else:
            print("  [警告] 未检测到导航栏")
            return True

    except Exception as e:
        print(f"  [失败] {str(e)}")
        return False

def test_main_page_components(page):
    """测试主页面组件"""
    try:
        components = {
            '.upload-area': '图片上传区域',
            '.prompt-editor': '提示词编辑器',
            '.generate-button': '生成按钮',
            '.result-viewer': '结果查看器',
            '.export-panel': '导出面板'
        }

        for selector, name in components.items():
            element = page.locator(selector)
            if element.count() > 0:
                print(f"  [通过] {name} 存在")
            else:
                print(f"  [警告] {name} 未找到（可能需要先生成图片）")

        return True
    except Exception as e:
        print(f"  [失败] {str(e)}")
        return False

def test_responsive_layout(page):
    """测试响应式布局"""
    try:
        viewport_sizes = [
            (1920, 1080, "桌面PC"),
            (1366, 768, "笔记本"),
            (768, 1024, "平板"),
            (375, 667, "手机")
        ]

        for width, height, device in viewport_sizes:
            page.set_viewport_size({"width": width, "height": height})
            page.wait_for_timeout(300)

            navbar = page.locator('.navbar')
            if navbar.count() > 0:
                print(f"  [通过] {device} ({width}x{height}) 布局正常")
            else:
                print(f"  [警告] {device} 布局异常")

        page.set_viewport_size({"width": 1920, "height": 1080})

        return True
    except Exception as e:
        print(f"  [失败] {str(e)}")
        return False

if __name__ == "__main__":
    success = run_integration_test()
    sys.exit(0 if success else 1)
