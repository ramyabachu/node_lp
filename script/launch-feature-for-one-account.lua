redis.call('SADD', KEYS[1], ARGV[2]);
redis.call('SADD', KEYS[2], ARGV[1]);
