import random
import time
#from run_simulation import Simulation
gamesPer = 2
totalWeights = 3
POPULATION_SIZE = 1000
TOTAL_GENS = 100


def getRand(range=1):
    return random.uniform(-range, range)

class Chromosome(object):

    def avg_fitness(self):
        return self.total_fitness / self.games

    def __init__(self, weights, cond):
        self.weights = []
        if cond != 1:
            self.weights = weights
        else:
            for i in range(totalWeights):
                self.weights.append(getRand())
        self.total_fitness = 0
        self.games = 0


class GeneticAlgorithm(object):

    def genScore(self, weights):
        #myMap = {}
        #myMap['num_holes'] = weights[0] #36, 0.12s
        #myMap['num_gaps'] = weights[0] #40, 0.06s
        #myMap['max_height'] = weights[1] #36 very random don't even , 0.02s
        #myMap['avg_height'] = weights[0] #36, slow af
        #myMap['completed_lines'] = weights[1] #38, 0.05s
        #myMap['bumpiness'] = weights[0] # slow af
        #MyMap['num_blocks'] = weights[3] #38, 0.1s
        #MyMap['num_blocks_above_holes'] = weights[0] #???

        #t = time.time()
        #ret = self.sim.simulate(myMap)

        return random.uniform(0,100)

    def __init__(self):
        self.population = []
        for i in range(POPULATION_SIZE):
            self.population.append(Chromosome(None,1))
        self.current_chromosome = 0
        self.current_generation = 1
        #self.sim = Simulation()
        self.totalScore = 0
        self.next_generation()

    def next_generation(self):
        #where the gen algorithm goes
        print("__________________\n")
        print "GEN: ", self.current_generation
        population = self.population
        self.totalScore = 0
        self.totalTime = 0
        #RUNNING GAMES AND GETTING THE SCORES FOR EACH Chromosome_______________
        for i in population:
            for q in range(gamesPer):
                i.games += 1
                #i.total_fitness = self.genScore(i.weights)
                i.total_fitness += self.genScore(i.weights)

        top = self.getTopTenPercent(population)
        for i in top:
            self.totalScore += i.avg_fitness()
            #self.totalTime += i.time
        print "Avg:",self.totalScore // len(top)
        #print self.totalTime / len(top)

        weights = []
        #BREEDING_______________________________________________________________
        for i in range(int(POPULATION_SIZE*0.4)):
            weights.append(self.cross(self.getRandomTopTenPercentTopTwo(population)))

        #RANDOM GEN_____________________________________________________________
        for v in range(int(POPULATION_SIZE*0.1)):
            weights.append(Chromosome(None, 1).weights)

        #CHANGING GENERATIONS___________________________________________________
        self.current_generation = self.current_generation + 1
        if self.current_generation == TOTAL_GENS:
            return

        #SETTING NEW POPULATION_________________________________________________
        self.sortFullList(population)
        self.population = self.population[:(POPULATION_SIZE//2)]
        for i in range(POPULATION_SIZE//2):
            self.population.append(Chromosome(weights[i],0))
        self.next_generation()


    def cross(self, top):
        weightList = []
        parent1 = top[0].weights
        parent2 = top[1].weights
        for i in range(totalWeights):
            toAppend = 0
            if random.uniform(0,1) <= 0.5:
                toAppend = parent1[i]
            else:
                toAppend = parent2[i]
            if random.uniform(0,1) <= 0.2:
                toAppend = -toAppend
            weightList.append(toAppend)
        return weightList

    def sortFullList(self, population):
        return sorted(population,key = lambda x: x.avg_fitness())


    def getTopTenPercent(self, population):
        return sorted(population,key = lambda x: x.avg_fitness())[-POPULATION_SIZE//10:]

    def getRandomTopTenPercentTopTwo(self, population):
        randomTenPercent = random.sample(population, POPULATION_SIZE//10)
        return sorted(randomTenPercent,key = lambda x: x.avg_fitness())[:2]


gen = GeneticAlgorithm()
