from tetris import check_collision, COLS, join_matrices, rotate_clockwise
import heuristic
from collections import namedtuple

Move = namedtuple('Move', ['x_pos', 'rotation', 'result'])

class AI(object):
	def __init__(self, tetris):
		self.tetris = tetris
		self.heuristics = {
			heuristic.num_holes: -496,
			heuristic.num_blocks_above_holes: 897,
			heuristic.num_gaps: -19,
			heuristic.max_height: -910,
			heuristic.avg_height: -747,
			heuristic.num_blocks: 174,
		}
		self.instant_play = True

	def board_with_stone(self, x, y, stone):
		"""Return new board with stone included"""
		return join_matrices(self.tetris.board, stone, (x, y))

	def intersection_point(self, x, stone):
		"""Find the y coordinate closest to the top where stone will collide"""
		y = 0
		while not check_collision(self.tetris.board, stone, (x, y)):
			y += 1
		return y - 1

	@staticmethod
	def max_x_pos_for_stone(stone):
		"""The furthest position you can move stone to the right"""
		return COLS - len(stone[0])

	@staticmethod
	def num_rotations(stone):
		"""The number of unique rotated positions of stone"""
		stones = [stone]
		while True:
			stone = rotate_clockwise(stone)
			if stone in stones:
				return len(stones)
			stones.append(stone)

	def utility(self, board):
		return sum([fun(board)*weight for (fun, weight) in self.heuristics.items()])

	def all_possible_moves(self):
		moves = []
		stone = self.tetris.stone
		for r in range(AI.num_rotations(stone)):
			for x in range(self.max_x_pos_for_stone(stone)+1):
				y = self.intersection_point(x, stone)
				board = self.board_with_stone(x, y, stone)
				moves.append(Move(x, r, board))
			stone = rotate_clockwise(stone)
		return moves		

	def best_move(self):
		return max(self.all_possible_moves(), key=lambda m: self.utility(m.result))		

	def make_move(self):
		"""Move the current stone to the desired position by modifying TetrisApp's state"""
		tetris = self.tetris

		move = self.best_move()

		tetris.lock.acquire()
		for _ in range(move.rotation):
			tetris.stone = rotate_clockwise(tetris.stone)
		tetris.move_to(move.x_pos)		
		if self.instant_play:
			tetris.stone_y = self.intersection_point(move.x_pos, tetris.stone)
		tetris.lock.release()
