#!/usr/bin/env python3
#-*- coding: utf-8 -*-

# Based off: https://gist.github.com/kch42/565419/download

# NOTE FOR WINDOWS USERS:
# You can download a "exefied" version of this game at:
# http://kch42.de/progs/tetris_py_exefied.zip
# If a DLL is missing or something like this, write an E-Mail (kevin@kch42.de)
# or leave a comment on this gist.

# Very simple tetris implementation
# 
# Control keys:
#       Down - Drop stone faster
# Left/Right - Move stone
#         Up - Rotate Stone clockwise
#     Escape - Quit game
#          P - Pause game
#     Return - Instant drop
#
# Have fun!

# Copyright (c) 2010 "Kevin Chabowski"<kevin@kch42.de>
# 
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
# 
# The above copyright notice and this permission notice shall be included in
# all copies or substantial portions of the Software.
# 
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
# THE SOFTWARE.

from random import randrange
import pygame, sys
from copy import deepcopy
from threading import Lock

# Config
CELL_SIZE =	20
COLS = 10
ROWS = 22
MAX_FPS = 30
DROP_TIME = 20
DRAW = True

COLORS = [
	(0,   0,   0),
	(255, 85,  85),
	(100, 200, 115),
	(120, 108, 245),
	(255, 140, 50),
	(50,  120, 52),
	(146, 202, 73),
	(150, 161, 218),
	(35,  35,  35) 
]

STONES = [
	[[1, 1, 1],
	 [0, 1, 0]],
	
	[[0, 2, 2],
	 [2, 2, 0]],
	
	[[3, 3, 0],
	 [0, 3, 3]],
	
	[[4, 0, 0],
	 [4, 4, 4]],
	
	[[0, 0, 5],
	 [5, 5, 5]],
	
	[[6, 6, 6, 6]],
	
	[[7, 7],
	 [7, 7]]
]

def rotate_clockwise(shape):
	return [ [ shape[y][x]
		for y in range(len(shape)) ]
		for x in range(len(shape[0])-1, -1, -1) ]

def check_collision(board, shape, offset):
	off_x, off_y = offset
	for cy, row in enumerate(shape):
		for cx, cell in enumerate(row):
			try:
				if cell and board[cy + off_y][cx + off_x]:
					return True
			except IndexError:
				return True
	return False

def remove_row(board, row):
	del board[row]
	return [[0 for i in range(COLS)]] + board
	
def join_matrices(mat1, mat2, mat2_off):
	mat3 = deepcopy(mat1)
	off_x, off_y = mat2_off
	for cy, row in enumerate(mat2):
		for cx, val in enumerate(row):
			mat3[cy+off_y-1][cx+off_x] += val
	return mat3

def new_board():
	board = [[0 for x in range(COLS)] for y in range(ROWS)]
	board += [[1 for x in range(COLS)]]
	return board

class TetrisApp(object):
	def __init__(self, runner=None):
		self.DROPEVENT = pygame.USEREVENT + 1

		pygame.init()
		pygame.display.set_caption("Tetris AI")
		pygame.key.set_repeat(250,25)
		self.width = CELL_SIZE * (COLS+10)
		self.height = CELL_SIZE * ROWS
		self.rlim = CELL_SIZE * COLS
		self.bground_grid = [[ 8 if x%2==y%2 else 0 for x in range(COLS)] for y in range(ROWS)]
		self.default_font = pygame.font.Font(pygame.font.get_default_font(), 11)
		self.screen = pygame.display.set_mode((self.width, self.height))
		self.next_stone = STONES[randrange(len(STONES))]
		self.gameover = False
		self.runner = runner
		self.ai = None
		self.lock = Lock()
		self.init_game()
	
	def new_stone(self):
		self.stone = self.next_stone
		self.next_stone = STONES[randrange(len(STONES))]
		self.stone_x = COLS//2 - len(self.stone[0])//2
		self.stone_y = 0
		self.score += 1
		
		if check_collision(self.board, self.stone, (self.stone_x, self.stone_y)):
			self.gameover = True
			if self.runner:
				self.runner.on_game_over(self.score)

	def init_game(self):
		self.board = new_board()
		self.score = 0
		self.new_stone()
		pygame.time.set_timer(self.DROPEVENT, DROP_TIME)
	
	def disp_msg(self, msg, topleft):
		x,y = topleft
		for line in msg.splitlines():
			self.screen.blit(self.default_font.render(line, False, (255,255,255), (0,0,0)), (x,y))
			y+=14
	
	def center_msg(self, msg):
		for i, line in enumerate(msg.splitlines()):
			msg_image =  self.default_font.render(line, False,
				(255,255,255), (0,0,0))
		
			msgim_center_x, msgim_center_y = msg_image.get_size()
			msgim_center_x //= 2
			msgim_center_y //= 2
		
			self.screen.blit(msg_image, (
			  self.width // 2-msgim_center_x,
			  self.height // 2-msgim_center_y+i*22))
	
	def draw_matrix(self, matrix, offset):
		off_x, off_y  = offset
		for y, row in enumerate(matrix):
			for x, val in enumerate(row):
				if val:
					try:
						pygame.draw.rect(self.screen, COLORS[val], 
							pygame.Rect((off_x+x)*CELL_SIZE, (off_y+y)*CELL_SIZE, CELL_SIZE, CELL_SIZE), 0)
					except IndexError:
						print("Corrupted board") # TODO: pretty sure this is now fixed.
						print(self.board)
	
	def add_cl_lines(self, n):
		linescores = [0, 40, 100, 300, 1200]
		self.score += linescores[n]
	
	def move_to(self, x):
		self.move(x - self.stone_x)

	def move(self, delta_x):
		if not self.gameover:
			new_x = self.stone_x + delta_x
			if new_x < 0:
				new_x = 0
			if new_x > COLS - len(self.stone[0]):
				new_x = COLS - len(self.stone[0])
			if not check_collision(self.board, self.stone, (new_x, self.stone_y)):
				self.stone_x = new_x
	
	def drop(self):
		self.lock.acquire()
		if not self.gameover:
			self.stone_y += 1
			if check_collision(self.board, self.stone, (self.stone_x, self.stone_y)):
				self.board = join_matrices(self.board, self.stone, (self.stone_x, self.stone_y))
				self.new_stone()
				cleared_rows = 0
				for i, row in enumerate(self.board[:-1]):
					if 0 not in row:
						self.board = remove_row(self.board, i)
						cleared_rows += 1
				self.add_cl_lines(cleared_rows)

				self.lock.release()				
				if self.ai:
					self.ai.make_move()

				return True
		self.lock.release()
		return False
	
	def insta_drop(self):
		if not self.gameover:
			while not self.drop():
				pass
	
	def rotate_stone(self):
		if not self.gameover:
			new_stone = rotate_clockwise(self.stone)
			if not check_collision(self.board, new_stone, (self.stone_x, self.stone_y)):
				self.stone = new_stone

	def start_game(self):
		if self.gameover:
			self.init_game()
			self.gameover = False
	
	def ai_toggle_instant_play(self):
		if self.ai:
			self.ai.instant_play = not self.ai.instant_play

	def run(self):
		key_actions = {
			'ESCAPE':	sys.exit,
			'LEFT': lambda: self.move(-1),
			'RIGHT': lambda: self.move(+1),
			'DOWN': self.drop,
			'UP': self.rotate_stone,
			'SPACE': self.start_game,
			'RETURN': self.insta_drop,
			'p': self.ai_toggle_instant_play,
		}
		
		clock = pygame.time.Clock()
		while True:
			if DRAW:
				self.screen.fill((0,0,0))
				if self.gameover:
					self.center_msg("Game Over!\nYour score: %d\nPress space to continue" % self.score)
				else:
					pygame.draw.line(self.screen, (255,255,255), 
						(self.rlim+1, 0), (self.rlim+1, self.height-1))
					self.disp_msg("Next:", (self.rlim+CELL_SIZE, 2))
					self.disp_msg("Score: %d" % self.score, (self.rlim+CELL_SIZE, CELL_SIZE*5))
					if self.ai and self.runner:
						from heuristic import num_holes, num_blocks_above_holes, num_gaps, max_height, avg_height, num_blocks
						chromosome = self.runner.population[self.runner.current_chromosome]
						self.disp_msg("Discontentment: %d" % -self.ai.utility(self.board), (self.rlim+CELL_SIZE, CELL_SIZE*10))
						self.disp_msg("Generation: %s" % self.runner.current_generation, (self.rlim+CELL_SIZE, CELL_SIZE*11))
						self.disp_msg("Chromosome: %d" % chromosome.name, (self.rlim+CELL_SIZE, CELL_SIZE*12))
						self.disp_msg("\n  %s: %s\n  %s: %s\n  %s: %s\n  %s: %s\n  %s: %s\n  %s: %s" % (
							"num_holes", chromosome.heuristics[num_holes],
							"num_blocks_above_holes", chromosome.heuristics[num_blocks_above_holes],
							"num_gaps", chromosome.heuristics[num_gaps],
							"max_height", chromosome.heuristics[max_height],
							"avg_height", chromosome.heuristics[avg_height],
							"num_blocks", chromosome.heuristics[num_blocks],
						), (self.rlim+CELL_SIZE, CELL_SIZE*12.1))
					self.draw_matrix(self.bground_grid, (0,0))
					self.draw_matrix(self.board, (0,0))
					self.draw_matrix(self.stone, (self.stone_x, self.stone_y))
					self.draw_matrix(self.next_stone, (COLS+1,2))
				pygame.display.update()
			
			for event in pygame.event.get():
				if event.type == self.DROPEVENT:
					self.drop()
				elif event.type == pygame.QUIT:
					sys.exit()
				elif event.type == pygame.KEYDOWN:
					for key in key_actions:
						if event.key == eval("pygame.K_" + key):
							key_actions[key]()
					
			clock.tick(MAX_FPS)

if __name__ == "__main__":
	from ai import AI
	app = TetrisApp()
	app.ai = AI(app)
	app.ai.instant_play = False
	app.run()
