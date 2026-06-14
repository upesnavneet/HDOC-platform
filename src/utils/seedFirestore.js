// One-time Firestore seeder - populates empty collections on first launch.
// Imports the same data shape used by the mock db.js to keep parity.

import { db as firestoreDb } from '../firebaseConfig';
import { doc, setDoc, collection, getDocs } from 'firebase/firestore';
import { log, error as logError } from './logger';
import { getDefaultSystemConfig } from './eventConfig';

const seedQuestions = [
  {
    day: 1,
    titleLc: 'Two Sum',
    linkLc: 'https://leetcode.com/problems/two-sum/',
    descLc:
      'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
    titleCustom: 'Find Maximum Element',
    descCustom:
      'Write an efficient function to find the maximum value in an unsorted integer array. Constraint: Time Complexity O(n). Input: [3, 8, 2, 9, 1]. Output: 9.',
    difficulty: 'Easy',
    isMaster: false,
    handout: 'Day 1 Handout: Array Basics and Hash Maps overview.',
    solutionCode: '',
  },
  {
    day: 2,
    titleLc: 'Reverse Linked List',
    linkLc: 'https://leetcode.com/problems/reverse-linked-list/',
    descLc:
      'Given the head of a singly linked list, reverse the list, and return the reversed list.',
    titleCustom: 'Detect Loop in Linked List',
    descCustom:
      "Implement Floyd's Cycle-Finding Algorithm to detect if a given singly linked list contains a cycle. Space Complexity O(1).",
    difficulty: 'Easy',
    isMaster: false,
    handout: "Day 2 Handout: Linked List Traversal, Pointers, and Floyd's Cycle Detection.",
    solutionCode: '',
  },
  {
    day: 3,
    titleLc: 'Valid Parentheses',
    linkLc: 'https://leetcode.com/problems/valid-parentheses/',
    descLc:
      "Given a string containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
    titleCustom: 'Evaluate Reverse Polish Notation',
    descCustom:
      'Evaluate the value of an arithmetic expression in Reverse Polish Notation. Valid operators are +, -, *, and /.',
    difficulty: 'Medium',
    isMaster: false,
    handout: 'Day 3 Handout: Stack operations and token parsing.',
    solutionCode: '',
  },
  {
    day: 4,
    titleLc: 'Merge Intervals',
    linkLc: 'https://leetcode.com/problems/merge-intervals/',
    descLc:
      'Given an array of intervals where intervals[i] = [start_i, end_i], merge all overlapping intervals.',
    titleCustom: 'Insert Interval',
    descCustom:
      'Insert a new interval into a sorted list of non-overlapping intervals, and merge overlaps if necessary.',
    difficulty: 'Medium',
    isMaster: false,
    handout: 'Day 4 Handout: Greedy intervals and sorting intervals by start point.',
    solutionCode: '',
  },
  {
    day: 5,
    titleLc: '3Sum',
    linkLc: 'https://leetcode.com/problems/3sum/',
    descLc:
      'Find all unique triplets in the array that sum up to zero. No duplicate triplets allowed.',
    titleCustom: 'Container With Most Water',
    descCustom:
      'Given n non-negative integers representing heights of vertical lines, find two lines that form a container containing the most water.',
    difficulty: 'Medium',
    isMaster: false,
    handout: 'Day 5 Handout: Two-pointer technique and shrinking search space.',
    solutionCode: '',
  },
  {
    day: 6,
    titleLc: 'Top K Frequent Elements',
    linkLc: 'https://leetcode.com/problems/top-k-frequent-elements/',
    descLc: 'Given an integer array nums and an integer k, return the k most frequent elements.',
    titleCustom: 'Kth Largest Element',
    descCustom: 'Find the kth largest element in an unsorted array.',
    difficulty: 'Medium',
    isMaster: false,
    handout: 'Day 6 Handout: Heap/PriorityQueue concepts and bucket sort solutions.',
    solutionCode: '',
  },
  {
    day: 7,
    titleLc: 'Binary Tree Level Order Traversal',
    linkLc: 'https://leetcode.com/problems/binary-tree-level-order-traversal/',
    descLc:
      "Given the root of a binary tree, return the level order traversal of its nodes' values.",
    titleCustom: 'Serialize and Deserialize Binary Tree',
    descCustom: 'Design an algorithm to serialize and deserialize a binary tree.',
    difficulty: 'Hard',
    isMaster: false,
    handout: 'Day 7 Handout: Tree traversal (BFS vs DFS).',
    solutionCode: '',
  },
  {
    day: 8,
    titleLc: 'Edit Distance',
    linkLc: 'https://leetcode.com/problems/edit-distance/',
    descLc:
      'Given two strings word1 and word2, return the minimum number of operations required to convert word1 to word2.',
    titleCustom: 'Longest Common Subsequence',
    descCustom:
      'Given two strings text1 and text2, return the length of their longest common subsequence.',
    difficulty: 'Medium',
    isMaster: false,
    handout: 'Day 8 Handout: Dynamic Programming introduction, matrix alignment.',
    solutionCode: '',
  },
  {
    day: 9,
    titleLc: 'Course Schedule',
    linkLc: 'https://leetcode.com/problems/course-schedule/',
    descLc:
      'There are numCourses courses to take with prerequisites. Return true if you can finish all courses.',
    titleCustom: 'Course Schedule II',
    descCustom: 'Find the actual ordering of courses you should take to finish all courses.',
    difficulty: 'Medium',
    isMaster: false,
    handout: "Day 9 Handout: Graphs, Kahn's Algorithm, and Topological Sorting.",
    solutionCode: '',
  },
  {
    day: 10,
    titleLc: 'Longest Palindromic Substring',
    linkLc: 'https://leetcode.com/problems/longest-palindromic-substring/',
    descLc: 'Given a string s, return the longest palindromic substring in s.',
    titleCustom: 'Count Palindromic Substrings',
    descCustom: 'Given a string s, return the number of palindromic substrings in it.',
    difficulty: 'Medium',
    isMaster: false,
    handout: "Day 10 Handout: Expanding around centers and Manacher's algorithm.",
    solutionCode: '',
  },
  {
    day: 11,
    titleLc: 'Implement Trie (Prefix Tree)',
    linkLc: 'https://leetcode.com/problems/implement-trie-prefix-tree/',
    descLc:
      'A trie or prefix tree is a tree data structure used to efficiently store and retrieve keys in a dataset of strings.',
    titleCustom: 'Word Search II',
    descCustom:
      'Given an m x n board of characters and a list of strings words, return all words on the board using a Trie.',
    difficulty: 'Hard',
    isMaster: false,
    handout: 'Day 11 Handout: Advanced prefix structures and backtracking on matrices.',
    solutionCode: '',
  },
  {
    day: 12,
    titleLc: 'Subsets',
    linkLc: 'https://leetcode.com/problems/subsets/',
    descLc:
      'Given an integer array nums of unique elements, return all possible subsets (the power set).',
    titleCustom: 'Permutations',
    descCustom: 'Given an array nums of distinct integers, return all the possible permutations.',
    difficulty: 'Medium',
    isMaster: false,
    handout: '',
    solutionCode: '',
  },
  {
    day: 99,
    titleLc: 'Binary Tree Maximum Path Sum',
    linkLc: 'https://leetcode.com/problems/binary-tree-maximum-path-sum/',
    descLc: 'A path in a binary tree is a sequence of nodes. Return the maximum path sum.',
    titleCustom: 'Merge k Sorted Lists',
    descCustom: 'Merge k sorted linked lists and return it as one sorted list.',
    difficulty: 'Hard',
    isMaster: true,
    handout: '',
    solutionCode: '',
  },
  {
    day: 100,
    titleLc: 'LRU Cache',
    linkLc: 'https://leetcode.com/problems/lru-cache/',
    descLc:
      'Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.',
    titleCustom: 'Median of Two Sorted Arrays',
    descCustom:
      'Given two sorted arrays nums1 and nums2, return the median. Time complexity must be O(log(m+n)).',
    difficulty: 'Hard',
    isMaster: true,
    handout: '',
    solutionCode: '',
  },
];

const seedDebuggingChallenges = [
  {
    week: 1,
    theme: 'Memory Leak and BFS Traversal',
    description: 'Find and fix the memory leak in this BFS graph traversal.',
    starterCode:
      'void bfs(Node* root) {\n  if (!root) return;\n  queue<Node*> q;\n  q.push(root);\n  while (!q.empty()) {\n    Node* curr = q.front(); q.pop();\n    cout << curr->val << " ";\n    for (Node* neighbor : curr->neighbors) {\n      q.push(neighbor);\n    }\n  }\n}',
    publishedDate: new Date('2026-05-24T21:00:00Z').toISOString(),
  },
  {
    week: 2,
    theme: 'Concurrency & Deadlocks',
    description:
      'Identify the deadlock scenario in the thread synchronization. Fix the locking order.',
    starterCode:
      'void threadA() {\n  lock_guard<mutex> lock1(mutA);\n  this_thread::sleep_for(10ms);\n  lock_guard<mutex> lock2(mutB);\n}\nvoid threadB() {\n  lock_guard<mutex> lock1(mutB);\n  this_thread::sleep_for(10ms);\n  lock_guard<mutex> lock2(mutA);\n}',
    publishedDate: new Date('2026-05-31T21:00:00Z').toISOString(),
  },
  {
    week: 3,
    theme: 'Dynamic Programming Array Index OOB',
    description: 'Fix the index out of bound error in this Knapsack bottom-up solution.',
    starterCode:
      'int knapsack(vector<int>& wt, vector<int>& val, int W, int n) {\n  vector<vector<int>> dp(n+1, vector<int>(W+1, 0));\n  for (int i = 0; i <= n; i++) {\n    for (int w = 0; w <= W; w++) {\n      if (i==0||w==0) dp[i][w]=0;\n      else dp[i][w] = max(dp[i-1][w], val[i]+dp[i-1][w-wt[i]]);\n    }\n  }\n  return dp[n][W];\n}',
    publishedDate: new Date('2026-06-07T21:00:00Z').toISOString(),
  },
];

/**
 * Seeds Firestore with initial data if collections are empty.
 * Returns true if seeding was performed, false if data already exists.
 */
export async function seedFirestoreIfEmpty() {
  try {
    // Check if questions collection already has data
    const questionsSnap = await getDocs(collection(firestoreDb, 'questions'));
    if (questionsSnap.size > 0) {
      return false;
    }

    log('[Seed] Empty Firestore detected - seeding initial data...');

    // 1. Seed system config at Day 0
    await setDoc(doc(firestoreDb, 'system', 'config'), {
      currentDay: 0,
      simulatedTime: '2026-06-01T09:00:00+05:30',
      completedWeeks: [1],
      lastDayAdvanceTime: new Date(),
    });
    log('[Seed] ✓ System config created');

    // 2. Seed questions
    for (const q of seedQuestions) {
      await setDoc(doc(firestoreDb, 'questions', `day-${q.day}`), q);
    }
    log(`[Seed] ✓ ${seedQuestions.length} questions seeded`);

    // 3. Seed debugging challenges
    for (const c of seedDebuggingChallenges) {
      await setDoc(doc(firestoreDb, 'debuggingChallenges', `week-${c.week}`), c);
    }
    log(`[Seed] ✓ ${seedDebuggingChallenges.length} debugging challenges seeded`);

    log('[Seed] ✅ Firestore seeding complete!');
    return true;
  } catch (error) {
    logError('[Seed] Failed to seed Firestore:', error);
    return false;
  }
}
