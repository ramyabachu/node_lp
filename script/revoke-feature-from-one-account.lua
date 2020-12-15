redis.call('SREM', KEYS[1], ARGV[2]);
redis.call('SREM', KEYS[2], ARGV[1]);
