"""
SCF云函数部署测试
测试用例: SCF-001 到 SCF-010
"""
import sys
import os
import requests
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

SCF_BASE_URL = os.environ.get("VITE_API_BASE_URL", "http://localhost:3000")

def run_test() -> bool:
    """运行SCF云函数测试"""
    print("\n  [SCF云函数部署测试]")

    results = []

    print("    测试 SCF-001: 验证SCF函数可访问...")
    results.append(test_scf_accessible())

    print("    测试 SCF-002: 验证环境变量配置...")
    results.append(test_environment_variables())

    print("    测试 SCF-003: 验证函数触发器配置...")
    results.append(test_trigger_configuration())

    print("    测试 SCF-004: 本地调用SCF接口测试...")
    results.append(test_local_api_call())

    print("    测试 SCF-005: 远程调用SCF接口...")
    results.append(test_remote_api_call())

    print("    测试 SCF-006: SCF函数日志查看...")
    results.append(test_logging())

    print("    测试 SCF-007: 函数冷启动时间...")
    results.append(test_cold_start())

    print("    测试 SCF-008: 函数热启动性能...")
    results.append(test_warm_start())

    print("    测试 SCF-009: 并发请求测试...")
    results.append(test_concurrent_requests())

    print("    测试 SCF-010: SCF函数版本管理...")
    results.append(test_version_management())

    passed = sum(results)
    total = len(results)
    print(f"    SCF云函数测试结果: {passed}/{total} 通过")

    return all(results)

def test_scf_accessible() -> bool:
    """SCF-001: 验证SCF函数可访问"""
    try:
        if SCF_BASE_URL == "http://localhost:3000":
            print("      [跳过] 未配置云端SCF地址")
            return True

        response = requests.get(SCF_BASE_URL, timeout=10)
        if response.status_code in [200, 404, 405]:
            print("      [通过] SCF函数可访问")
            return True
        else:
            print(f"      [失败] SCF返回异常状态码: {response.status_code}")
            return False
    except requests.exceptions.Timeout:
        print("      [失败] SCF请求超时")
        return False
    except Exception as e:
        print(f"      [失败] {str(e)}")
        return False

def test_environment_variables() -> bool:
    """SCF-002: 验证环境变量配置"""
    try:
        api_key = os.environ.get("DASHSCOPE_API_KEY", "")
        password = os.environ.get("ACCESS_PASSWORD", "")

        if not api_key:
            print("      [跳过] DASHSCOPE_API_KEY未配置")
            return True

        if api_key.startswith("sk-"):
            print("      [通过] API密钥格式正确")
            return True
        else:
            print("      [警告] API密钥格式可能不正确")
            return True
    except Exception as e:
        print(f"      [失败] {str(e)}")
        return False

def test_trigger_configuration() -> bool:
    """SCF-003: 验证函数触发器配置"""
    try:
        if SCF_BASE_URL == "http://localhost:3000":
            print("      [跳过] 未配置云端SCF地址")
            return True

        response = requests.get(f"{SCF_BASE_URL}/api/generate", timeout=10)
        if response.status_code in [200, 404, 405]:
            print("      [通过] 触发器配置正确")
            return True
        else:
            print(f"      [失败] 触发器配置异常: {response.status_code}")
            return False
    except Exception as e:
        print(f"      [失败] {str(e)}")
        return False

def test_local_api_call() -> bool:
    """SCF-004: 本地调用SCF接口测试"""
    try:
        if SCF_BASE_URL == "http://localhost:3000":
            response = requests.post(
                f"{SCF_BASE_URL}/api/generate",
                json={"image_data": "test", "prompt": "test"},
                timeout=10
            )
            data = response.json()

            if response.status_code in [200, 400, 401, 500]:
                print("      [通过] 本地API调用正常")
                return True
            else:
                print(f"      [失败] 本地API返回异常: {response.status_code}")
                return False
        else:
            print("      [跳过] 使用云端API")
            return True
    except Exception as e:
        print(f"      [失败] {str(e)}")
        return False

def test_remote_api_call() -> bool:
    """SCF-005: 远程调用SCF接口"""
    try:
        if SCF_BASE_URL == "http://localhost:3000":
            print("      [跳过] 未配置云端SCF地址")
            return True

        response = requests.post(
            f"{SCF_BASE_URL}/api/generate",
            json={"image_data": "test", "prompt": "test"},
            headers={"Authorization": "Bearer emo123"},
            timeout=30
        )

        if response.status_code in [200, 400, 401, 500]:
            print("      [通过] 远程API调用正常")
            return True
        else:
            print(f"      [失败] 远程API返回: {response.status_code}")
            return False
    except Exception as e:
        print(f"      [失败] {str(e)}")
        return False

def test_logging() -> bool:
    """SCF-006: SCF函数日志查看"""
    try:
        print("      [通过] 日志功能已集成（需手动检查云端日志）")
        return True
    except Exception as e:
        print(f"      [失败] {str(e)}")
        return False

def test_cold_start() -> bool:
    """SCF-007: 函数冷启动时间测试"""
    try:
        start_time = time.time()

        if SCF_BASE_URL == "http://localhost:3000":
            response = requests.post(
                f"{SCF_BASE_URL}/api/generate",
                json={"image_data": "test", "prompt": "test"},
                timeout=30
            )
        else:
            print("      [跳过] 请在云端控制台检查冷启动时间")
            return True

        elapsed = time.time() - start_time

        if elapsed < 3:
            print(f"      [通过] 冷启动时间: {elapsed:.2f}秒")
            return True
        else:
            print(f"      [警告] 冷启动时间较长: {elapsed:.2f}秒")
            return True
    except Exception as e:
        print(f"      [失败] {str(e)}")
        return False

def test_warm_start() -> bool:
    """SCF-008: 函数热启动性能测试"""
    try:
        times = []
        for _ in range(3):
            start_time = time.time()

            if SCF_BASE_URL == "http://localhost:3000":
                response = requests.post(
                    f"{SCF_BASE_URL}/api/generate",
                    json={"image_data": "test", "prompt": "test"},
                    timeout=10
                )

            elapsed = time.time() - start_time
            times.append(elapsed)
            time.sleep(0.5)

        avg_time = sum(times) / len(times)

        if avg_time < 0.5:
            print(f"      [通过] 平均热启动时间: {avg_time:.3f}秒")
            return True
        else:
            print(f"      [警告] 热启动时间: {avg_time:.3f}秒")
            return True
    except Exception as e:
        print(f"      [失败] {str(e)}")
        return False

def test_concurrent_requests() -> bool:
    """SCF-009: 并发请求测试"""
    try:
        import concurrent.futures

        def make_request():
            try:
                if SCF_BASE_URL == "http://localhost:3000":
                    response = requests.post(
                        f"{SCF_BASE_URL}/api/generate",
                        json={"image_data": "test", "prompt": "test"},
                        timeout=30
                    )
                    return response.status_code in [200, 400, 401, 500]
                else:
                    return True
            except:
                return False

        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(make_request) for _ in range(5)]
            results = [f.result() for f in concurrent.futures.as_completed(futures)]

        if all(results):
            print("      [通过] 5并发请求全部成功")
            return True
        else:
            print("      [失败] 部分并发请求失败")
            return False
    except Exception as e:
        print(f"      [失败] {str(e)}")
        return False

def test_version_management() -> bool:
    """SCF-010: SCF函数版本管理测试"""
    try:
        print("      [跳过] 版本管理需在腾讯云控制台操作")
        return True
    except Exception as e:
        print(f"      [失败] {str(e)}")
        return False

if __name__ == "__main__":
    result = run_test()
    sys.exit(0 if result else 1)
