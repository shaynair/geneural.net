import unittest
from heuristic import *

class TestHeuristics(unittest.TestCase):
	def setUp(self):
		# See doc/test_board.png for a clearer version of this board.
		self.board = [
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 4, 4, 0, 0, 0, 0],
			[0, 0, 0, 0, 4, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 4, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 2, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 2, 2, 0, 0, 0, 0],
			[0, 0, 7, 0, 0, 2, 0, 0, 0, 0],
			[0, 0, 7, 0, 0, 2, 2, 0, 0, 0],
			[0, 0, 7, 0, 2, 2, 1, 0, 0, 0],
			[0, 0, 7, 0, 0, 0, 1, 1, 0, 0],
			[7, 7, 7, 7, 0, 0, 1, 0, 0, 0],
			[7, 7, 7, 7, 0, 6, 6, 6, 6, 0],
			[1, 0, 0, 7, 7, 0, 4, 4, 0, 0],
			[1, 1, 0, 7, 7, 0, 4, 0, 0, 0],
			[1, 0, 6, 6, 6, 6, 4, 0, 0, 0],
		]

	def test_num_holes(self):
		self.assertEqual(num_holes(self.board), 22)

	def test_num_blocks_above_holes(self):
		self.assertEqual(num_blocks_above_holes(self.board), 25)

	def test_num_gaps(self):
		self.assertEqual(num_gaps(self.board), 7)

	def test_max_height(self):
		self.assertEqual(max_height(self.board), 13)

	def test_avg_height(self):
		total_height = 13*2 + 12*1 + 11*1 + 10*1 + 9*2 + 8*2 + 7*3 + 6*4 + 5*3 + 4*5 + 3*8 + 2*5 + 1*5 + 0*6
		self.assertEqual(avg_height(self.board), total_height / num_blocks(self.board))

	def test_num_blocks(self):
		self.assertEqual(num_blocks(self.board), 48)

if __name__ == '__main__':
		unittest.main()