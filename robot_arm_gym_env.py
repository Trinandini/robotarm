pip install gym numpy
import gym
from gym import spaces
import numpy as np
import math


class RobotArmEnv(gym.Env):
    """
    Simple 2D robot arm reaching a target (object) on a unit square.
    This is the Gym environment concept behind the visualization.
    """
    metadata = {"render.modes": ["human"]}

    def __init__(self):
        super(RobotArmEnv, self).__init__()

        # Observation: [robot_x, robot_y, object_x, object_y] in [0, 1]
        self.observation_space = spaces.Box(
            low=0.0, high=1.0, shape=(4,), dtype=np.float32
        )

        # Actions: 0=up, 1=down, 2=left, 3=right
        self.action_space = spaces.Discrete(4)

        self.max_steps = 50
        self.step_size = 0.05
        self.reset()

    def reset(self, *, seed=None, options=None):
        super().reset(seed=seed)

        # Start robot near bottom-left
        self.robot = np.array([0.2, 0.2], dtype=np.float32)
        # Random object position in central area
        self.object = np.random.uniform(0.3, 0.8, size=(2,)).astype(np.float32)

        self.steps = 0
        obs = self._get_obs()
        return obs, {}

    def _get_obs(self):
        return np.concatenate([self.robot, self.object])

    def step(self, action):
        # Move robot
        if action == 0:   # up
            self.robot[1] += self.step_size
        elif action == 1: # down
            self.robot[1] -= self.step_size
        elif action == 2: # left
            self.robot[0] -= self.step_size
        elif action == 3: # right
            self.robot[0] += self.step_size

        # Clip into [0, 1]
        self.robot = np.clip(self.robot, 0.0, 1.0)

        self.steps += 1

        # Distance to object
        dist = np.linalg.norm(self.robot - self.object)

        # Reward: negative distance (closer is better)
        reward = -dist

        # Success if close enough
        done = dist < 0.07
        if done:
            reward += 1.0  # success bonus

        # Episode end by max steps
        if self.steps >= self.max_steps:
            done = True

        obs = self._get_obs()
        truncated = False  # not using truncation separately here
        info = {"distance": dist}

        return obs, reward, done, truncated, info

    def render(self, mode="human"):
        # Simple text render for debugging
        print(f"Robot: {self.robot}, Object: {self.object}")


# -------- Simple Q-learning on top of this Gym environment -------- #

def discretize_diff(robot, obj, bins=7):
    """
    Discretize the (dx, dy) difference between robot and object
    into a small grid index for Q-table.
    """
    diff = obj - robot  # target - robot
    # diff ranges roughly in [-1,1]
    # map to [0, bins-1]
    idx = ((diff + 1.0) / 2.0) * (bins - 1)
    idx = np.clip(idx, 0, bins - 1)
    return tuple(idx.astype(int))


def train_q_learning(episodes=500, bins=7, gamma=0.95, alpha=0.1, epsilon=0.2):
    env = RobotArmEnv()

    # Q-table: (dx_bin, dy_bin, action)
    Q = np.zeros((bins, bins, env.action_space.n), dtype=np.float32)

    for ep in range(episodes):
        obs, _ = env.reset()
        robot = obs[:2]
        obj = obs[2:]

        state = discretize_diff(robot, obj, bins=bins)
        total_reward = 0.0

        done = False
        while not done:
            # ε-greedy action
            if np.random.rand() < epsilon:
                action = env.action_space.sample()
            else:
                action = np.argmax(Q[state])

            next_obs, reward, done, _, info = env.step(action)
            next_robot = next_obs[:2]
            next_obj = next_obs[2:]

            next_state = discretize_diff(next_robot, next_obj, bins=bins)

            # Q-learning update
            best_next = np.max(Q[next_state])
            Q[state][action] = (1 - alpha) * Q[state][action] + alpha * (reward + gamma * best_next)

            state = next_state
            robot = next_robot
            obj = next_obj
            total_reward += reward

        if (ep + 1) % 50 == 0:
            print(f"Episode {ep+1}/{episodes}, total reward: {total_reward:.3f}")

    return Q


if __name__ == "__main__":
    print("Training Q-learning agent in RobotArmEnv (OpenAI Gym)...")
    Q = train_q_learning(episodes=500)

    # Test one episode with greedy policy
    env = RobotArmEnv()
    obs, _ = env.reset()
    robot = obs[:2]
    obj = obs[2:]
    state = discretize_diff(robot, obj)
    done = False
    steps = 0

    print("\nTesting greedy policy after training:")
    while not done and steps < 50:
        action = np.argmax(Q[state])
        obs, reward, done, _, info = env.step(action)
        robot = obs[:2]
        obj = obs[2:]
        state = discretize_diff(robot, obj)
        steps += 1
        print(f"Step {steps}: robot={robot}, distance={info['distance']:.3f}, reward={reward:.3f}")

    print("Test episode finished.")
