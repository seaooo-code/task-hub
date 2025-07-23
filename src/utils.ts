export function camelToSnake(camelCase: string): string {
  return camelCase.replace(/([A-Z])/g, '_$1').toLowerCase();
}
export function convertKeysToSnakeCase<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj; // 处理 null 和非对象
  }

  // 创建一个新对象
  const newObj: { [key: string]: any } = Array.isArray(obj) ? [] : {};

  for (const key in obj) {
    const snakeKey = camelToSnake(key); // 转换键名
    newObj[snakeKey] = convertKeysToSnakeCase(obj[key]); // 递归转换值
  }

  return newObj as T; // 返回转换后的对象
}

/**
 * 将形如 4-14:00 的字符串转成合法的 cron 表达式
 * @param dayOfWeek 星期几 (0-7，0和7都表示周日)
 * @param hour 小时 (0-23)
 * @param minute 分钟 (0-59)
 */
export function convertToCron(
  dayOfWeek: number,
  hour: number,
  minute: number,
): string {
  if (
    isNaN(dayOfWeek) ||
    dayOfWeek < 0 ||
    dayOfWeek > 7 ||
    isNaN(hour) ||
    hour < 0 ||
    hour >= 24 ||
    isNaN(minute) ||
    minute < 0 ||
    minute >= 60
  ) {
    throw new Error('Invalid values for day, hour, or minute.');
  }

  // 生成 Cron 表达式
  return `${minute} ${hour} * * ${dayOfWeek}`;
}
