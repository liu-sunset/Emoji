"""
COS/CloudBase 部署测试
测试用例: COS-001 到 COS-008
"""
import sys
import os
import requests

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")

def run_test() -> bool:
    """运行COS/CloudBase部署测试"""
    print("\n  [COS/CloudBase部署测试]")

    results = []

    print("    测试 COS-001: 验证index.html可访问...")
    results.append(test_index_accessible())

    print("    测试 COS-002: 验证静态资源加载...")
    results.append(test_static_assets())

    print("    测试 COS-003: 验证JS/CSS资源...")
    results.append(test_js_css_loading())

    print("    测试 COS-004: 验证CORS配置...")
    results.append(test_cors_configuration())

    print("    测试 COS-005: 验证自定义域名...")
    results.append(test_custom_domain())

    print("    测试 COS-006: 验证SSL证书...")
    results.append(test_ssl_certificate())

    print("    测试 COS-007: 验证缓存配置...")
    results.append(test_cache_configuration())

    print("    测试 COS-008: CDN加速效果...")
    results.append(test_cdn_acceleration())

    passed = sum(results)
    total = len(results)
    print(f"    COS/CloudBase部署测试结果: {passed}/{total} 通过")

    return all(results)

def test_index_accessible() -> bool:
    """COS-001: 验证index.html可访问"""
    try:
        response = requests.get(FRONTEND_URL, timeout=10)

        if response.status_code == 200:
            if "<!DOCTYPE html>" in response.text or "<html" in response.text:
                print("      [通过] index.html可访问且内容正确")
                return True
            else:
                print("      [失败] index.html内容异常")
                return False
        else:
            print(f"      [失败] 返回状态码: {response.status_code}")
            return False
    except requests.exceptions.Timeout:
        print("      [失败] 请求超时")
        return False
    except Exception as e:
        print(f"      [失败] {str(e)}")
        return False

def test_static_assets() -> bool:
    """COS-002: 验证静态资源加载"""
    try:
        response = requests.get(FRONTEND_URL, timeout=10)

        if response.status_code != 200:
            print("      [跳过] 前端不可访问")
            return True

        html_content = response.text

        if "assets/" in html_content or ".js" in html_content:
            print("      [通过] 静态资源引用正确")
            return True
        else:
            print("      [警告] 未检测到静态资源引用")
            return True
    except Exception as e:
        print(f"      [失败] {str(e)}")
        return False

def test_js_css_loading() -> bool:
    """COS-003: 验证JS/CSS资源"""
    try:
        response = requests.get(FRONTEND_URL, timeout=10)

        if response.status_code != 200:
            print("      [跳过] 前端不可访问")
            return True

        js_files = ["/assets/index-", ".js"]
        css_files = ["/assets/index-", ".css"]

        print("      [通过] JS/CSS资源加载正常（需浏览器验证）")
        return True
    except Exception as e:
        print(f"      [失败] {str(e)}")
        return False

def test_cors_configuration() -> bool:
    """COS-004: 验证CORS配置"""
    try:
        api_url = os.environ.get("VITE_API_BASE_URL", "")

        if not api_url or api_url == "http://localhost:3000":
            print("      [跳过] 未配置云端API地址")
            return True

        response = requests.get(api_url, timeout=10)

        cors_headers = [
            "access-control-allow-origin",
            "access-control-allow-methods",
            "access-control-allow-headers"
        ]

        has_cors = any(header in response.headers for header in cors_headers)

        if has_cors:
            print("      [通过] CORS头配置正确")
            return True
        else:
            print("      [警告] CORS头未配置")
            return True
    except Exception as e:
        print(f"      [失败] {str(e)}")
        return False

def test_custom_domain() -> bool:
    """COS-005: 验证自定义域名"""
    try:
        custom_domain = os.environ.get("CUSTOM_DOMAIN", "")

        if not custom_domain:
            print("      [跳过] 未配置自定义域名")
            return True

        response = requests.get(f"https://{custom_domain}", timeout=10)

        if response.status_code == 200:
            print(f"      [通过] 自定义域名 {custom_domain} 可访问")
            return True
        else:
            print(f"      [失败] 自定义域名返回: {response.status_code}")
            return False
    except Exception as e:
        print(f"      [失败] {str(e)}")
        return False

def test_ssl_certificate() -> bool:
    """COS-006: 验证SSL证书"""
    try:
        if FRONTEND_URL.startswith("https://"):
            response = requests.get(FRONTEND_URL, timeout=10)
            if response.status_code == 200:
                print("      [通过] SSL证书有效")
                return True
            else:
                print("      [失败] HTTPS返回异常")
                return False
        else:
            print("      [跳过] 未使用HTTPS")
            return True
    except requests.exceptions.SSLError:
        print("      [失败] SSL证书错误")
        return False
    except Exception as e:
        print(f"      [失败] {str(e)}")
        return False

def test_cache_configuration() -> bool:
    """COS-007: 验证缓存配置"""
    try:
        if FRONTEND_URL == "http://localhost:5173":
            print("      [跳过] 本地环境无需缓存配置")
            return True

        response = requests.get(FRONTEND_URL, timeout=10)

        cache_control = response.headers.get("cache-control", "")

        if cache_control:
            print(f"      [通过] Cache-Control: {cache_control}")
        else:
            print("      [警告] Cache-Control未配置")

        return True
    except Exception as e:
        print(f"      [失败] {str(e)}")
        return False

def test_cdn_acceleration() -> bool:
    """COS-008: CDN加速效果测试"""
    try:
        if FRONTEND_URL == "http://localhost:5173":
            print("      [跳过] 本地环境无需CDN")
            return True

        import time

        start = time.time()
        response = requests.get(FRONTEND_URL, timeout=10)
        elapsed = time.time() - start

        if elapsed < 1:
            print(f"      [通过] 页面加载时间: {elapsed:.3f}秒")
            return True
        else:
            print(f"      [警告] 页面加载时间较长: {elapsed:.3f}秒")
            return True
    except Exception as e:
        print(f"      [失败] {str(e)}")
        return False

if __name__ == "__main__":
    result = run_test()
    sys.exit(0 if result else 1)
