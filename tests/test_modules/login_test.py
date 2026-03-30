"""
登录模块测试
测试用例: LOGIN-001 到 LOGIN-005
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

BASE_URL = os.getenv('TEST_BASE_URL', 'http://localhost:5173')


def run_test(page) -> bool:
    """运行登录模块测试"""
    print("\n  [登录模块测试]")

    results = []

    print("    测试 LOGIN-001: 输入正确密码登录...")
    results.append(test_correct_password(page))

    print("    测试 LOGIN-002: 输入错误密码登录...")
    results.append(test_wrong_password(page))

    print("    测试 LOGIN-003: 空密码提交...")
    results.append(test_empty_password(page))

    print("    测试 LOGIN-004: 24小时内再次访问（自动登录）...")
    results.append(test_auto_login(page))

    print("    测试 LOGIN-005: 退出登录...")
    results.append(test_logout(page))

    passed = sum(results)
    total = len(results)
    print(f"    登录模块测试结果: {passed}/{total} 通过")

    return all(results)

def test_correct_password(page) -> bool:
    """LOGIN-001: 输入正确密码登录"""
    try:
        page.goto(BASE_URL)
        page.wait_for_load_state("networkidle")

        password_input = page.locator('input[type="password"]')
        if password_input.count() == 0:
            print("      [失败] 未找到密码输入框")
            return False

        login_button = page.locator('button[type="submit"]')
        if login_button.count() == 0:
            print("      [失败] 未找到登录按钮")
            return False

        password_input.fill("emo123")
        login_button.click()

        page.wait_for_timeout(1000)

        if page.locator('.navbar').count() > 0:
            print("      [通过] 成功登录并跳转到主页")
            return True
        else:
            print("      [失败] 未跳转到主页")
            return False
    except Exception as e:
        print(f"      [失败] {str(e)}")
        return False

def test_wrong_password(page) -> bool:
    """LOGIN-002: 输入错误密码登录"""
    try:
        page.goto(BASE_URL)
        page.wait_for_load_state("networkidle")

        page.evaluate("() => localStorage.removeItem('emo_j_login_time')")
        page.reload()
        page.wait_for_load_state("networkidle")

        password_input = page.locator('input[type="password"]')
        password_input.fill("wrongpassword")

        login_button = page.locator('button[type="submit"]')
        login_button.click()

        page.wait_for_timeout(500)

        error_message = page.locator('.error-message')
        if error_message.count() > 0:
            print("      [通过] 显示密码错误提示")
            return True
        else:
            print("      [失败] 未显示错误提示")
            return False
    except Exception as e:
        print(f"      [失败] {str(e)}")
        return False

def test_empty_password(page) -> bool:
    """LOGIN-003: 空密码提交"""
    try:
        page.goto(BASE_URL)
        page.wait_for_load_state("networkidle")

        page.evaluate("() => localStorage.removeItem('emo_j_login_time')")
        page.reload()
        page.wait_for_load_state("networkidle")

        password_input = page.locator('input[type="password"]')
        password_input.fill("")

        login_button = page.locator('button[type="submit"]')
        login_button.click()

        page.wait_for_timeout(500)

        error_message = page.locator('.error-message')
        if error_message.count() > 0:
            print("      [通过] 空密码被拒绝")
            return True
        else:
            print("      [失败] 空密码未被处理")
            return False
    except Exception as e:
        print(f"      [失败] {str(e)}")
        return False

def test_auto_login(page) -> bool:
    """LOGIN-004: 24小时内再次访问（自动登录）"""
    try:
        page.evaluate("() => localStorage.setItem('emo_j_login_time', Date.now().toString())")

        page.goto(BASE_URL)
        page.wait_for_timeout(1500)

        if page.locator('.navbar').count() > 0:
            print("      [通过] 自动登录成功")
            return True
        else:
            print("      [失败] 自动登录未生效")
            return False
    except Exception as e:
        print(f"      [失败] {str(e)}")
        return False

def test_logout(page) -> bool:
    """LOGIN-005: 退出登录"""
    try:
        logout_button = page.locator('.logout-button')
        if logout_button.count() == 0:
            print("      [失败] 未找到退出按钮")
            return False

        logout_button.click()
        page.wait_for_timeout(500)

        if page.locator('.login-container').count() > 0:
            print("      [通过] 退出登录成功")
            return True
        else:
            print("      [失败] 未返回登录页面")
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
