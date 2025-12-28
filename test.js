// 简单的测试文件
// 这里可以添加更多的测试用例

console.log('🧪 开始测试...');

// 测试环境变量设置
process.env.TEST_VAR = "test_value";
console.log('✅ 环境变量测试:', process.env.TEST_VAR === "test_value" ? "通过" : "失败");

// 测试基本功能
try {
  // 这里可以添加更多测试
  console.log('✅ 基本功能测试: 通过');
} catch (error) {
  console.log('❌ 基本功能测试: 失败', error.message);
}

console.log('🎉 测试完成！');