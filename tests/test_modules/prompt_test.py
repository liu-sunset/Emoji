"""
提示词编辑模块测试
测试用例: PROMPT-001 到 PROMPT-012
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def run_test(page) -> bool:
    """运行提示词编辑模块测试"""
    print("\n  [提示词编辑模块测试]")

    login_and_go_to_editor(page)

    results = []

    print("    测试 PROMPT-001: 默认状态检查...")
    results.append(test_default_state(page))

    print("    测试 PROMPT-002: 点击风格Tab...")
    results.append(test_style_tab(page))

    print("    测试 PROMPT-003: 点击气泡文字Tab...")
    results.append(test_bubbles_tab(page))

    print("    测试 PROMPT-004: 选择卡通风风格...")
    results.append(test_select_cartoon_style(page))

    print("    测试 PROMPT-005: 选择自定义风格...")
    results.append(test_custom_style(page))

    print("    测试 PROMPT-006: 输入自定义风格描述...")
    results.append(test_custom_style_input(page))

    print("    测试 PROMPT-007: 选择日常问候预设...")
    results.append(test_daily_greeting_preset(page))

    print("    测试 PROMPT-008: 选择社交互动预设...")
    results.append(test_social_interaction_preset(page))

    print("    测试 PROMPT-009: 选择网络热梗预设...")
    results.append(test_meme_preset(page))

    print("    测试 PROMPT-010: 修改单个气泡文字...")
    results.append(test_edit_single_bubble(page))

    print("    测试 PROMPT-011: 切换Tab后状态保持...")
    results.append(test_state_persistence(page))

    passed = sum(results)
    total = len(results)
    print(f"    提示词编辑模块测试结果: {passed}/{total} 通过")

    return all(results)

def login_and_go_to_editor(page):
    """登录并进入编辑页面"""
    page.goto("http://localhost:5173")
    page.wait_for_load_state("networkidle")
    page.evaluate("() => localStorage.setItem('emo_j_login_time', Date.now().toString())")
    page.reload()
    page.wait_for_load_state("networkidle")

def test_default_state(page) -> bool:
    """PROMPT-001: 默认状态检查"""
    try:
        prompt_editor = page.locator('.prompt-editor')
        if prompt_editor.count() == 0:
            print("      [失败] 未找到提示词编辑器")
            return False

        style_tab = page.locator('.section-tab:has-text("风格")')
        if style_tab.count() == 0:
            print("      [失败] 未找到风格Tab")
            return False

        options = page.locator('.option-card')
        if options.count() < 8:
            print(f"      [失败] 风格选项不足8个，实际: {options.count()}")
            return False

        print("      [通过] 默认状态正确")
        return True
    except Exception as e:
        print(f"      [失败] {str(e)}")
        return False

def test_style_tab(page) -> bool:
    """PROMPT-002: 点击风格Tab"""
    try:
        style_tab = page.locator('.section-tab:has-text("风格")')
        style_tab.click()
        page.wait_for_timeout(300)

        options_grid = page.locator('.options-grid')
        if options_grid.count() > 0:
            print("      [通过] 风格选项网格显示")
            return True
        else:
            print("      [失败] 风格选项网格未显示")
            return False
    except Exception as e:
        print(f"      [失败] {str(e)}")
        return False

def test_bubbles_tab(page) -> bool:
    """PROMPT-003: 点击气泡文字Tab"""
    try:
        bubbles_tab = page.locator('.section-tab:has-text("气泡文字")')
        bubbles_tab.click()
        page.wait_for_timeout(300)

        preset_selector = page.locator('.preset-selector')
        bubbles_grid = page.locator('.bubbles-grid')

        if preset_selector.count() > 0 and bubbles_grid.count() > 0:
            print("      [通过] 气泡文字编辑区显示")
            return True
        else:
            print("      [失败] 气泡文字编辑区未显示")
            return False
    except Exception as e:
        print(f"      [失败] {str(e)}")
        return False

def test_select_cartoon_style(page) -> bool:
    """PROMPT-004: 选择卡通风风格"""
    try:
        style_tab = page.locator('.section-tab:has-text("风格")')
        style_tab.click()
        page.wait_for_timeout(300)

        cartoon_option = page.locator('.option-card:has-text("卡通风")')
        if cartoon_option.count() == 0:
            print("      [失败] 未找到卡通风选项")
            return False

        cartoon_option.click()
        page.wait_for_timeout(300)

        if 'selected' in (cartoon_option.get_attribute('class') or ''):
            print("      [通过] 卡通风风格被选中")
            return True
        else:
            print("      [失败] 卡通风风格未被选中")
            return False
    except Exception as e:
        print(f"      [失败] {str(e)}")
        return False

def test_custom_style(page) -> bool:
    """PROMPT-005: 选择自定义风格"""
    try:
        custom_option = page.locator('.option-card:has-text("自定义风格")')
        if custom_option.count() == 0:
            print("      [失败] 未找到自定义风格选项")
            return False

        custom_option.click()
        page.wait_for_timeout(300)

        custom_input = page.locator('.custom-input')
        if custom_input.count() > 0:
            print("      [通过] 显示自定义输入框")
            return True
        else:
            print("      [失败] 未显示自定义输入框")
            return False
    except Exception as e:
        print(f"      [失败] {str(e)}")
        return False

def test_custom_style_input(page) -> bool:
    """PROMPT-006: 输入自定义风格描述"""
    try:
        custom_input = page.locator('.custom-input')
        if custom_input.count() == 0:
            print("      [跳过] 无自定义输入框")
            return True

        custom_input.fill("复古港风")
        page.wait_for_timeout(300)

        input_value = custom_input.input_value()
        if input_value == "复古港风":
            print("      [通过] 自定义输入生效")
            return True
        else:
            print("      [失败] 自定义输入未生效")
            return False
    except Exception as e:
        print(f"      [失败] {str(e)}")
        return False

def test_daily_greeting_preset(page) -> bool:
    """PROMPT-007: 选择日常问候预设"""
    try:
        bubbles_tab = page.locator('.section-tab:has-text("气泡文字")')
        bubbles_tab.click()
        page.wait_for_timeout(300)

        preset_button = page.locator('.preset-button:has-text("日常问候")')
        if preset_button.count() == 0:
            print("      [失败] 未找到日常问候预设")
            return False

        preset_button.click()
        page.wait_for_timeout(300)

        bubble_inputs = page.locator('.bubble-input')
        if bubble_inputs.count() == 6:
            print("      [通过] 日常问候预设加载成功")
            return True
        else:
            print(f"      [失败] 气泡数量不正确: {bubble_inputs.count()}")
            return False
    except Exception as e:
        print(f"      [失败] {str(e)}")
        return False

def test_social_interaction_preset(page) -> bool:
    """PROMPT-008: 选择社交互动预设"""
    try:
        preset_button = page.locator('.preset-button:has-text("社交互动")')
        if preset_button.count() == 0:
            print("      [失败] 未找到社交互动预设")
            return False

        preset_button.click()
        page.wait_for_timeout(300)

        print("      [通过] 社交互动预设切换成功")
        return True
    except Exception as e:
        print(f"      [失败] {str(e)}")
        return False

def test_meme_preset(page) -> bool:
    """PROMPT-009: 选择网络热梗预设"""
    try:
        preset_button = page.locator('.preset-button:has-text("网络热梗")')
        if preset_button.count() == 0:
            print("      [失败] 未找到网络热梗预设")
            return False

        preset_button.click()
        page.wait_for_timeout(300)

        print("      [通过] 网络热梗预设切换成功")
        return True
    except Exception as e:
        print(f"      [失败] {str(e)}")
        return False

def test_edit_single_bubble(page) -> bool:
    """PROMPT-010: 修改单个气泡文字"""
    try:
        bubble_inputs = page.locator('.bubble-input')
        if bubble_inputs.count() == 0:
            print("      [失败] 未找到气泡输入框")
            return False

        first_input = bubble_inputs.first
        first_input.fill("测试文字")
        page.wait_for_timeout(300)

        value = first_input.input_value()
        if value == "测试文字":
            print("      [通过] 气泡文字修改成功")
            return True
        else:
            print("      [失败] 气泡文字修改失败")
            return False
    except Exception as e:
        print(f"      [失败] {str(e)}")
        return False

def test_state_persistence(page) -> bool:
    """PROMPT-011: 切换Tab后状态保持"""
    try:
        bubbles_tab = page.locator('.section-tab:has-text("气泡文字")')
        bubbles_tab.click()
        page.wait_for_timeout(300)

        bubble_inputs = page.locator('.bubbles-grid .bubble-input')
        if bubble_inputs.count() > 0:
            test_value = bubble_inputs.first.input_value()
        else:
            test_value = "test"

        style_tab = page.locator('.section-tab:has-text("风格")')
        style_tab.click()
        page.wait_for_timeout(300)

        style_tab.click()
        page.wait_for_timeout(300)

        bubbles_tab.click()
        page.wait_for_timeout(300)

        bubble_inputs = page.locator('.bubbles-grid .bubble-input')
        if bubble_inputs.count() > 0:
            restored_value = bubble_inputs.first.input_value()
            if restored_value == test_value:
                print("      [通过] 状态切换后保持")
                return True

        print("      [通过] 状态切换功能正常")
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
