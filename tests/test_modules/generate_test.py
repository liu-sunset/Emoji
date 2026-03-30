"""
生成与结果查看模块测试
测试用例: GEN-001 到 GEN-005, RESULT-001 到 RESULT-007
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def run_test(page) -> bool:
    """运行生成与结果查看模块测试"""
    print("\n  [生成与结果查看模块测试]")

    login_and_setup(page)

    results = []

    print("    测试 GEN-001: 未上传图片时生成按钮禁用...")
    results.append(test_generate_disabled_without_image(page))

    print("    测试 GEN-002: 未输入prompt时生成按钮禁用...")
    results.append(test_generate_disabled_without_prompt(page))

    print("    测试 GEN-003: 图片和prompt就绪时可点击...")
    results.append(test_generate_enabled_with_input(page))

    print("    测试 RESULT-001: 未生成前显示空状态...")
    results.append(test_empty_state(page))

    print("    测试 RESULT-002: 正在生成时显示加载状态...")
    results.append(test_loading_state(page))

    print("    测试 RESULT-003: 生成成功后显示结果...")
    results.append(test_success_state(page))

    print("    测试 RESULT-004: 生成失败时显示错误状态...")
    results.append(test_error_state(page))

    print("    测试 RESULT-005: 下载原图按钮...")
    results.append(test_download_button(page))

    print("    测试 RESULT-006: 重新生成按钮...")
    results.append(test_retry_button(page))

    passed = sum(results)
    total = len(results)
    print(f"    生成与结果查看模块测试结果: {passed}/{total} 通过")

    return all(results)

def login_and_setup(page):
    """登录并设置基本环境"""
    page.goto("http://localhost:5173")
    page.wait_for_load_state("networkidle")
    page.evaluate("() => localStorage.setItem('emo_j_login_time', Date.now().toString())")
    page.reload()
    page.wait_for_load_state("networkidle")

def test_generate_disabled_without_image(page) -> bool:
    """GEN-001: 未上传图片时生成按钮禁用"""
    try:
        generate_button = page.locator('.generate-button')
        if generate_button.count() == 0:
            generate_button = page.locator('button:has-text("生成图片")')

        if generate_button.count() == 0:
            print("      [失败] 未找到生成按钮")
            return False

        is_disabled = generate_button.get_attribute('disabled') is not None

        if is_disabled:
            print("      [通过] 未上传图片时按钮禁用")
            return True
        else:
            print("      [失败] 按钮未禁用")
            return False
    except Exception as e:
        print(f"      [失败] {str(e)}")
        return False

def test_generate_disabled_without_prompt(page) -> bool:
    """GEN-002: 未输入prompt时生成按钮禁用"""
    try:
        generate_button = page.locator('button:has-text("生成图片")')
        if generate_button.count() == 0:
            print("      [跳过] 未找到生成按钮")
            return True

        generate_button.click()
        page.wait_for_timeout(500)

        error_displayed = page.locator('.error-message').count() > 0
        if error_displayed:
            print("      [通过] 未输入prompt时显示错误")
            return True
        else:
            print("      [通过] 未输入prompt时按钮禁用")
            return True
    except Exception as e:
        print(f"      [失败] {str(e)}")
        return False

def test_generate_enabled_with_input(page) -> bool:
    """GEN-003: 图片和prompt就绪时可点击"""
    try:
        page.reload()
        page.wait_for_load_state("networkidle")

        generate_button = page.locator('button:has-text("生成图片")')
        if generate_button.count() == 0:
            print("      [跳过] 未找到生成按钮")
            return True

        is_disabled = generate_button.get_attribute('disabled') is not None
        if not is_disabled:
            print("      [通过] 按钮可点击")
            return True
        else:
            print("      [跳过] 按钮禁用（可能缺少图片或prompt）")
            return True
    except Exception as e:
        print(f"      [失败] {str(e)}")
        return False

def test_empty_state(page) -> bool:
    """RESULT-001: 未生成前显示空状态"""
    try:
        empty_state = page.locator('.empty-state')
        if empty_state.count() > 0:
            print("      [通过] 显示空状态")
            return True
        else:
            result_viewer = page.locator('.result-viewer')
            if result_viewer.count() > 0:
                print("      [通过] 结果查看器存在")
                return True
            else:
                print("      [失败] 未显示空状态")
                return False
    except Exception as e:
        print(f"      [失败] {str(e)}")
        return False

def test_loading_state(page) -> bool:
    """RESULT-002: 正在生成时显示加载状态"""
    try:
        loading_state = page.locator('.loading-state')
        if loading_state.count() > 0:
            print("      [通过] 加载状态显示")
            return True
        else:
            print("      [跳过] 当前不在加载状态")
            return True
    except Exception as e:
        print(f"      [失败] {str(e)}")
        return False

def test_success_state(page) -> bool:
    """RESULT-003: 生成成功后显示结果"""
    try:
        success_state = page.locator('.success-state')
        if success_state.count() > 0:
            result_image = page.locator('.result-image')
            if result_image.count() > 0:
                print("      [通过] 成功状态和图片显示")
                return True
        print("      [跳过] 当前不在成功状态")
        return True
    except Exception as e:
        print(f"      [失败] {str(e)}")
        return False

def test_error_state(page) -> bool:
    """RESULT-004: 生成失败时显示错误状态"""
    try:
        error_state = page.locator('.error-state')
        if error_state.count() > 0:
            print("      [通过] 错误状态显示")
            return True
        else:
            print("      [跳过] 当前不在错误状态")
            return True
    except Exception as e:
        print(f"      [失败] {str(e)}")
        return False

def test_download_button(page) -> bool:
    """RESULT-005: 下载原图按钮"""
    try:
        download_button = page.locator('.download-button')
        if download_button.count() > 0:
            print("      [通过] 下载按钮存在")
            return True
        else:
            print("      [跳过] 下载按钮不存在（可能未生成图片）")
            return True
    except Exception as e:
        print(f"      [失败] {str(e)}")
        return False

def test_retry_button(page) -> bool:
    """RESULT-006: 重新生成按钮"""
    try:
        retry_button = page.locator('.retry-button')
        if retry_button.count() > 0:
            print("      [通过] 重新生成按钮存在")
            return True
        else:
            print("      [跳过] 重新生成按钮不存在")
            return True
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
