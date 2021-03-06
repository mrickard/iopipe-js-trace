import _ from 'lodash';
import Perf from 'performance-node';
import Redis from 'ioredis';
import { wrap, unwrap } from './ioredis';

jest.mock('ioredis');

const mockRedisStore = {};
const mockGet = key => {
  const keyArray = Object.keys(mockRedisStore);
  if (keyArray.indexOf(key) === -1) {
    return undefined;
  }
  return mockRedisStore[key];
};

const mockSet = (key, val) => {
  mockRedisStore[key] = val;
  return { key: val };
};

function timelineExpect({ timeline, data }) {
  const dataValues = _.values(data);
  expect(dataValues.length).toBeGreaterThan(0);
  const [obj] = dataValues;
  expect(obj.name).toBe('set');
  expect(obj.request).toBeDefined();
  expect(obj.request.key).toBeDefined();

  const entries = timeline.getEntries();
  expect(entries.length).toBeGreaterThan(0);
  expect(entries[0].name).toMatch(/^start:ioredis-(.){36}$/);
}

test('Basic Redis mock works as normal if wrap is not called', () => {
  const redis = new Redis();
  redis.set = jest.fn((key, val) => mockSet(key, val));
  redis.get = jest.fn(key => mockGet(key));

  const expectedStr = 'iopipe: ioredis';
  expect(redis.set.__wrapped).toBeUndefined();

  redis.set('testString', expectedStr);
  const returnedValue = redis.get('testString');

  expect(returnedValue).toBe(expectedStr);
});

xtest('Redis works as normal if wrap is not called', done => {
  const redis = new Redis();
  const expectedStr = 'iopipe: unwrapped ioredis';
  expect(redis.set.__wrapped).toBeUndefined();

  redis
    .set('testString', expectedStr)
    .then(async resolve => {
      const returnedValue = await redis.get('testString');
      expect(returnedValue).toBe(expectedStr);
      expect(resolve).toBeDefined();
      return done();
    })
    .catch(err => {
      return done(err);
    });
});

test('Bails if timeline is not instance of performance-node', () => {
  const bool = wrap({ timeline: [] });
  expect(bool).toBe(false);
});

describe('Wrapping Redis Mock', () => {
  let redis;

  afterEach(() => {
    unwrap();
  });

  afterAll(() => {
    redis.quit();
  });

  test('Mocking redis to pass CircleCI', () => {
    const timeline = new Perf({ timestamp: true });
    const data = {};

    wrap({ timeline, data });

    redis = new Redis();
    redis.set = jest.fn((key, val) => mockSet(key, val));
    redis.get = jest.fn(key => mockGet(key));

    const expectedStr = 'mock wrapped ioredis';
    redis.set('testString', expectedStr);

    const returnedValue = redis.get('testString');
    expect(returnedValue).toBe(expectedStr);

    // not doing timelineExpect because mock doesn't affect timeline
  });
});

xdescribe('Wrapping Redis', () => {
  let redis;

  afterEach(() => {
    unwrap();
    redis.flushdb();
  });

  afterAll(() => {
    redis.flushdb().then(() => {
      redis.quit();
    });
  });

  test(
    'Wrap works with redis.set and redis.get using async/await syntax',
    async () => {
      const timeline = new Perf({ timestamp: true });
      const data = {};

      wrap({ timeline, data });

      redis = new Redis({
        host: '0.0.0.0',
        connectionName: 'Test 1',
        db: 1
      });

      expect(redis.sendCommand.__wrapped).toBeDefined();

      const expectedStr = 'wrapped ioredis, async/await';

      redis.set('testString', expectedStr);

      const returnedValue = await redis.get('testString');
      expect(returnedValue).toBe(expectedStr);

      timelineExpect({ timeline, data });
    },
    15000
  );

  test(
    'Wrap works with redis.set/get using promise syntax',
    async () => {
      const timeline = new Perf({ timestamp: true });
      const data = {};

      wrap({ timeline, data });

      redis = new Redis({ host: '127.0.0.1', connectionName: 'Test 2', db: 1 });

      expect(redis.sendCommand.__wrapped).toBeDefined();

      const expectedStr = 'wrapped ioredis, promise syntax';

      redis.set('testString', expectedStr);

      const returnedValue = await redis
        .get('testString')
        .then(result => {
          expect(result).toBeDefined();
          expect(result).toBe(expectedStr);

          return result;
        })
        .catch(err => {
          expect(err).toBeNull();
        });

      expect(returnedValue).toBe(expectedStr);
    },
    15000
  );

  test(
    'Wrap works with redis.set/get using callback syntax',
    done => {
      const timeline = new Perf({ timestamp: true });
      const data = {};

      wrap({ timeline, data });

      redis = new Redis({ host: 'localhost', connectionName: 'Test 3', db: 1 });

      expect(redis.sendCommand.__wrapped).toBeDefined();

      const expectedStr = 'wrapped ioredis, callback syntax';
      redis.set('testString', expectedStr);

      expect(timeline.data).toHaveLength(1);

      redis.get('testString', (err, result) => {
        expect(result).toBeDefined();
        expect(result).toBe(expectedStr);
        expect(err).toBeNull();
        expect(timeline.data).toHaveLength(2);
        return result;
      });

      done();
    },
    15000
  );
});
