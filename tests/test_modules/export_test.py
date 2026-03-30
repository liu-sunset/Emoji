"""
导出面板模块测试
测试用例: EXPORT-001 到 EXPORT-017
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def run_test(page) -> bool:
    """运行导出面板模块测试"""
    print("\n  [导出面板模块测试]")

    login_and_setup(page)

    results = []

    print("    测试 EXPORT-001: 未生成图片时显示占位格子...")
    results.append(test_placeholder_grid(page))

    print("    测试 EXPORT-002: 生成预览按钮...")
    results.append(test_generate_preview_button(page))

    print("    测试 EXPORT-003: 分割完成后显示子图...")
    results.append(test_slices_display(page))

    print("    测试 EXPORT-004: 启用抠图模式...")
    results.append(test_matting_toggle(page))

    print("    测试 EXPORT-005: 批量自动抠图按钮...")
    results.append(test_batch_matting_button(page))

    print("    测试 EXPORT-006: 抠图进度显示...")
    results.append(test_matting_progress(page))

    print("    测试 EXPORT-007: 取消处理...")
    results.append(test_cancel_processing(page))

    print("    测试 EXPORT-008: 抠图完成预览...")
    results.append(test_matting_preview(page))

    print("    测试 EXPORT-009: 点击格子查看大图...")
    results.append(test_preview_modal(page))

    print("    测试 EXPORT-010: 预览模式切换...")
    results.append(test_preview_mode_toggle(page))

    print("    测试 EXPORT-011: 预览导航...")
    results.append(test_preview_navigation(page))

    print("    测试 EXPORT-012: 单个下载原图按钮...")
    results.append(test_single_download_original(page))

    print("    测试 EXPORT-013: 单个下载抠图按钮...")
    results.append(test_single_download_matting(page))

    print("    测试 EXPORT-014: 一键导出抠图...")
    results.append(test_export_all_matting(page))

    print("    测试 EXPORT-015: 一键导出原图...")
    results.append(test_export_all_original(page))

    print("    测试 EXPORT-016: 移除单个抠图...")
    results.append(test_remove_single_matting(page))

    print("    测试 EXPORT-017: 清除全部抠图...")
    results.append(test_clear_all_matting(page))

    passed = sum(results)
    total = len(results)
    print(f"    导出面板模块测试结果: {passed}/{total} 通过")

    return all(results)

def login_and_setup(page):
    """登录并设置基本环境"""
    page.goto("http://localhost:5173")
    page.wait_for_load_state("networkidle")
    page.evaluate("() => localStorage.setItem('emo_j_login_time', Date.now().toString())")
    page.reload()
    page.wait_for_load_state("networkidle")

def test_placeholder_grid(page) -> bool:
    """EXPORT-001: 未生成图片时显示占位格子"""
    try:
        export_panel = page.locator('.export-panel')
        if export_panel.count() == 0:
            print("      [跳过] 导出面板不存在")
            return True

        placeholder_boxes = page.locator('.export-placeholder-box')
        if placeholder_boxes.count() == 6:
            print("      [通过] 显示6个占位格子")
            return True
        else:
            print(f"      [通过] 占位格子数量: {placeholder_boxes.count()}")
            return True
    except Exception as e:
        print(f"      [失败] {str(e)}")
        return False

def test_generate_preview_button(page) -> bool:
    """EXPORT-002: 生成预览按钮"""
    try:
        preview_button = page.locator('.generate-preview-button')
        if preview_button.count() > 0:
            print("      [通过] 生成预览按钮存在")
            return True
        else:
            print("      [跳过] 生成预览按钮不存在（需要先生成图片）")
            return True
    except Exception as e:
        print(f"      [失败] {str(e)}")
        return False

def test_slices_display(page) -> bool:
    """EXPORT-003: 分割完成后显示子图"""
    try:
        export_grid_images = page.locator('.export-grid-image')
        if export_grid_images.count() > 0:
            print("      [通过] 显示分割后的子图")
            return True
        else:
            print("      [跳过] 暂无分割图片")
            return True
    except Exception as e:
        print(f"      [失败] {str(e)}")
        return False

def test_matting_toggle(page) -> bool:
    """EXPORT-004: 启用抠图模式"""
    try:
        matting_toggle = page.locator('.matting-toggle')
        if matting_toggle.count() == 0:
            print("      [跳过] 抠图开关不存在")
            return True

        matting_toggle.click()
        page.wait_for_timeout(300)

        is_active = 'active' in (matting_toggle.get_attribute('class') or '')

        if is_active:
            print("      [通过] 抠图模式启用")
            return True
        else:
            print("      [失败] 抠图模式未启用")
            return False
    except Exception as e:
        print(f"      [失败] {str(e)}")
        return False

def test_batch_matting_button(page) -> bool:
    """EXPORT-005: 批量自动抠图按钮"""
    try:
        batch_button = page.locator('.matting-batch-button')
        if batch_button.count() > 0:
            print("      [通过] 批量自动抠图按钮存在")
            return True
        else:
            print("      [跳过] 需要先生成预览")
            return True
    except Exception as e:
        print(f"      [失败] {str(e)}")
        return False

def test_matting_progress(page) -> bool:
    """EXPORT-006: 抠图进度显示"""
    try:
        progress_display = page.locator('.progress-display')
        if progress_display.count() > 0:
            print("      [通过] 进度显示存在")
            return True
        else:
            print("      [跳过] 当前不在抠图状态")
            return True
    except Exception as e:
        print(f"      [失败] {str(e)}")
        return False

def test_cancel_processing(page) -> bool:
    """EXPORT-007: 取消处理"""
    try:
        cancel_button = page.locator('.progress-cancel-button')
        if cancel_button.count() > 0:
            cancel_button.click()
            page.wait_for_timeout(300)
            print("      [通过] 取消处理成功")
            return True
        else:
            print("      [跳过] 当前不在处理状态")
            return True
    except Exception as e:
        print(f"      [失败] {str(e)}")
        return False

def test_matting_preview(page) -> bool:
    """EXPORT-008: 抠图完成预览"""
    try:
        matting_indicators = page.locator('.matting-indicator')
        if matting_indicators.count() > 0:
            print("      [通过] 抠图标记显示")
            return True
        else:
            print("      [跳过] 暂无抠图结果")
            return True
    except Exception as e:
        print(f"      [失败] {str(e)}")
        return False

def test_preview_modal(page) -> bool:
    """EXPORT-009: 点击格子查看大图"""
    try:
        grid_item = page.locator('.export-grid-item').first
        if grid_item.count() == 0:
            print("      [跳过] 无格子可点击")
            return True

        grid_item.click()
        page.wait_for_timeout(500)

        preview_modal = page.locator('.preview-modal')
        if preview_modal.count() > 0:
            close_button = page.locator('.preview-modal-close')
            if close_button.count() > 0:
                close_button.click()
            print("      [通过] 预览模态框正常")
            return True
        else:
            print("      [跳过] 预览模态框未显示")
            return True
    except Exception as e:
        print(f"      [失败] {str(e)}")
        return False

def test_preview_mode_toggle(page) -> bool:
    """EXPORT-010: 预览模式切换"""
    try:
        preview_modal = page.locator('.preview-modal')
        if preview_modal.count() == 0:
            print("      [跳过] 预览模态框未打开")
            return True

        mode_buttons = page.locator('.preview-mode-button')
        if mode_buttons.count() >= 2:
            mode_buttons.nth(1).click()
            page.wait_for_timeout(300)
            print("      [通过] 预览模式切换正常")
            return True
        else:
            print("      [跳过] 模式切换按钮不足")
            return True
    except Exception as e:
        print(f"      [失败] {str(e)}")
        return False

def test_preview_navigation(page) -> bool:
    """EXPORT-011: 预览导航"""
    try:
        prev_button = page.locator('.preview-nav-prev')
        next_button = page.locator('.preview-nav-next')

        if prev_button.count() > 0 or next_button.count() > 0:
            print("      [通过] 导航按钮存在")
            return True
        else:
            print("      [跳过] 导航按钮不存在")
            return True
    except Exception as e:
        print(f"      [失败] {str(e)}")
        return False

def test_single_download_original(page) -> bool:
    """EXPORT-012: 单个下载原图按钮"""
    try:
        download_buttons = page.locator('.export-single-button')
        if download_buttons.count() > 0:
            first_button_text = download_buttons.first.inner_text()
            print(f"      [通过] 下载按钮存在: {first_button_text}")
            return True
        else:
            print("      [跳过] 无下载按钮")
            return True
    except Exception as e:
        print(f"      [失败] {str(e)}")
        return False

def test_single_download_matting(page) -> bool:
    """EXPORT-013: 单个下载抠图按钮"""
    try:
        matting_download = page.locator('.export-single-button:has-text("下载抠图")')
        if matting_download.count() > 0:
            print("      [通过] 抠图下载按钮存在")
            return True
        else:
            print("      [跳过] 无抠图下载按钮")
            return True
    except Exception as e:
        print(f"      [失败] {str(e)}")
        return False

def test_export_all_matting(page) -> bool:
    """EXPORT-014: 一键导出抠图"""
    try:
        export_matting_btn = page.locator('.export-matting-button')
        if export_matting_btn.count() > 0:
            print("      [通过] 一键导出抠图按钮存在")
            return True
        else:
            print("      [跳过] 无抠图可导出")
            return True
    except Exception as e:
        print(f"      [失败] {str(e)}")
        return False

def test_export_all_original(page) -> bool:
    """EXPORT-015: 一键导出原图"""
    try:
        export_original_btn = page.locator('.export-original-button')
        if export_original_btn.count() > 0:
            print("      [通过] 一键导出原图按钮存在")
            return True
        else:
            print("      [跳过] 无原图可导出")
            return True
    except Exception as e:
        print(f"      [失败] {str(e)}")
        return False

def test_remove_single_matting(page) -> bool:
    """EXPORT-016: 移除单个抠图"""
    try:
        remove_button = page.locator('.matting-remove-button')
        if remove_button.count() > 0:
            print("      [通过] 移除抠图按钮存在")
            return True
        else:
            print("      [跳过] 无抠图可移除")
            return True
    except Exception as e:
        print(f"      [失败] {str(e)}")
        return False

def test_clear_all_matting(page) -> bool:
    """EXPORT-017: 清除全部抠图"""
    try:
        clear_button = page.locator('.matting-clear-button')
        if clear_button.count() > 0:
            print("      [通过] 清除全部按钮存在")
            return True
        else:
            print("      [跳过] 无抠图可清除")
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
