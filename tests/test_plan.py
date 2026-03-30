"""
EMO.J 项目全面测试执行脚本
用于执行所有模块的端到端测试
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def run_all_tests():
    """运行所有测试模块"""
    print("=" * 60)
    print("EMO.J 项目全面测试")
    print("=" * 60)

    test_modules = [
        ("登录模块", "test_modules.login_test"),
        ("图片上传模块", "test_modules.upload_test"),
        ("提示词编辑模块", "test_modules.prompt_test"),
        ("生成与结果查看模块", "test_modules.generate_test"),
        ("导出面板模块", "test_modules.export_test"),
    ]

    results = []
    for name, module in test_modules:
        print(f"\n[开始测试] {name}")
        try:
            result = run_module_test(module)
            results.append((name, result))
            print(f"[完成] {name} - {'通过' if result else '失败'}")
        except Exception as e:
            print(f"[错误] {name} - {str(e)}")
            results.append((name, False))

    print("\n" + "=" * 60)
    print("测试结果汇总")
    print("=" * 60)

    passed = sum(1 for _, r in results if r)
    total = len(results)

    for name, result in results:
        status = "✓ 通过" if result else "✗ 失败"
        print(f"  {status} - {name}")

    print(f"\n总计: {passed}/{total} 通过")

    return passed == total

def run_module_test(module_name: str) -> bool:
    """运行单个模块测试"""
    try:
        module = __import__(module_name, fromlist=['run_test'])
        if hasattr(module, 'run_test'):
            return module.run_test()
        return True
    except Exception as e:
        print(f"    错误: {str(e)}")
        return False

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
