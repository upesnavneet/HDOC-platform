// Simulated Database for the 100 Days of Code Event Management Platform
// Persists in localStorage for a fully functional live demo.

const STORAGE_KEY = 'acm_100_days_db';

// Helper to format simulated date string
export const formatSimulatedDate = (date) => {
  return new Date(date).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

const getInitialDB = () => {
  // Mock users
  const users = [
    {
      id: 'admin-1',
      name: 'ACM Technical Head',
      email: 'admin@acm.org',
      password: 'admin', // In real system hashed, for testing simple
      role: 'admin',
      studentId: 'ADMIN-001',
      gitHubId: 'acm-tech-head',
      leetCodeId: 'acm_technical_head'
    },
    {
      id: 'user-1',
      name: 'User',
      email: 'user@gmail.com',
      password: 'password',
      role: 'participant',
      studentId: 'SAP-500092301',
      gitHubId: 'user',
      leetCodeId: 'user_99',
      gitHubStreak: 12,
      leetCodeStreak: 10,
      totalCodingScore: 185,
      totalDebuggingScore: 36,
      overallRank: 1,
      isActive: true
    },
    {
      id: 'user-2',
      name: 'Alice Cooper',
      email: 'alice@gmail.com',
      password: 'password',
      role: 'participant',
      studentId: 'SAP-500092302',
      gitHubId: 'alice-cooper',
      leetCodeId: 'alice_coder',
      gitHubStreak: 11,
      leetCodeStreak: 9,
      totalCodingScore: 178,
      totalDebuggingScore: 32,
      overallRank: 2,
      isActive: true
    },
    {
      id: 'user-3',
      name: 'Bob Marley',
      email: 'bob@gmail.com',
      password: 'password',
      role: 'participant',
      studentId: 'SAP-500092303',
      gitHubId: 'bob-marley',
      leetCodeId: 'bob_algorithms',
      gitHubStreak: 9,
      leetCodeStreak: 9,
      totalCodingScore: 165,
      totalDebuggingScore: 40,
      overallRank: 3,
      isActive: true
    },
    {
      id: 'user-4',
      name: 'Charlie Puth',
      email: 'charlie@gmail.com',
      password: 'password',
      role: 'participant',
      studentId: 'SAP-500092304',
      gitHubId: 'charlie-puth',
      leetCodeId: 'charlie_binary',
      gitHubStreak: 8,
      leetCodeStreak: 8,
      totalCodingScore: 160,
      totalDebuggingScore: 28,
      overallRank: 4,
      isActive: true
    },
    {
      id: 'user-5',
      name: 'Diana Prince',
      email: 'diana@gmail.com',
      password: 'password',
      role: 'participant',
      studentId: 'SAP-500092305',
      gitHubId: 'diana-prince',
      leetCodeId: 'wonder_coder',
      gitHubStreak: 12,
      leetCodeStreak: 11,
      totalCodingScore: 155,
      totalDebuggingScore: 30,
      overallRank: 5,
      isActive: true
    },
    {
      id: 'user-6',
      name: 'Ethan Hunt',
      email: 'ethan@gmail.com',
      password: 'password',
      role: 'participant',
      studentId: 'SAP-500092306',
      gitHubId: 'ethan-hunt',
      leetCodeId: 'impossible_code',
      gitHubStreak: 5,
      leetCodeStreak: 4,
      totalCodingScore: 120,
      totalDebuggingScore: 35,
      overallRank: 6,
      isActive: true
    },
    {
      id: 'user-7',
      name: 'Fiona Gallagher',
      email: 'fiona@gmail.com',
      password: 'password',
      role: 'participant',
      studentId: 'SAP-500092307',
      gitHubId: 'fiona-gallagher',
      leetCodeId: 'fiona_dsa',
      gitHubStreak: 10,
      leetCodeStreak: 8,
      totalCodingScore: 115,
      totalDebuggingScore: 24,
      overallRank: 7,
      isActive: true
    },
    {
      id: 'user-8',
      name: 'George Weasley',
      email: 'george@gmail.com',
      password: 'password',
      role: 'participant',
      studentId: 'SAP-500092308',
      gitHubId: 'george-weasley',
      leetCodeId: 'prankster_code',
      gitHubStreak: 3,
      leetCodeStreak: 2,
      totalCodingScore: 88,
      totalDebuggingScore: 15,
      overallRank: 8,
      isActive: true
    },
    {
      id: 'user-9',
      name: 'Harry Potter',
      email: 'harry@gmail.com',
      password: 'password',
      role: 'participant',
      studentId: 'SAP-500092309',
      gitHubId: 'harry-potter',
      leetCodeId: 'wizard_lc',
      gitHubStreak: 12,
      leetCodeStreak: 12,
      totalCodingScore: 180,
      totalDebuggingScore: 38,
      overallRank: 9, // This will get updated dynamically
      isActive: true
    },
    {
      id: 'user-10',
      name: 'Ivy Stark',
      email: 'ivy@gmail.com',
      password: 'password',
      role: 'participant',
      studentId: 'SAP-500092310',
      gitHubId: 'ivy-stark',
      leetCodeId: 'iron_coder',
      gitHubStreak: 0, // Broken streak
      leetCodeStreak: 0,
      totalCodingScore: 40,
      totalDebuggingScore: 10,
      overallRank: 10,
      isActive: true
    }
  ];

  // Mock Questions
  const questions = [
    {
      id: 'q-1',
      day: 1,
      titleLc: 'Two Sum',
      linkLc: 'https://leetcode.com/problems/two-sum/',
      descLc: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
      titleCustom: 'Find Maximum Element',
      descCustom: 'Write an efficient function to find the maximum value in an unsorted integer array. Constraint: Time Complexity O(n). Input: [3, 8, 2, 9, 1]. Output: 9.',
      difficulty: 'Easy',
      isMaster: false,
      handout: 'Day 1 Handout: Array Basics and Hash Maps overview. PDF attachment simulated.',
      solutionCode: '// Two Sum (Java)\nclass Solution {\n    public int[] twoSum(int[] nums, int target) {\n        Map<Integer, Integer> map = new HashMap<>();\n        for (int i = 0; i < nums.length; i++) {\n            int complement = target - nums[i];\n            if (map.containsKey(complement)) {\n                return new int[] { map.get(complement), i };\n            }\n            map.put(nums[i], i);\n        }\n        throw new IllegalArgumentException("No solution");\n    }\n}'
    },
    {
      id: 'q-2',
      day: 2,
      titleLc: 'Reverse Linked List',
      linkLc: 'https://leetcode.com/problems/reverse-linked-list/',
      descLc: 'Given the head of a singly linked list, reverse the list, and return the reversed list.',
      titleCustom: 'Detect Loop in Linked List',
      descCustom: 'Implement Floyd\'s Cycle-Finding Algorithm to detect if a given singly linked list contains a cycle (loop). Space Complexity O(1).',
      difficulty: 'Easy',
      isMaster: false,
      handout: 'Day 2 Handout: Linked List Traversal, Pointers, and Floyd\'s Cycle Detection.',
      solutionCode: '// Reverse Linked List (Python)\ndef reverseList(head):\n    prev = None\n    curr = head\n    while curr:\n        next_node = curr.next\n        curr.next = prev\n        prev = curr\n        curr = next_node\n    return prev'
    },
    {
      id: 'q-3',
      day: 3,
      titleLc: 'Valid Parentheses',
      linkLc: 'https://leetcode.com/problems/valid-parentheses/',
      descLc: 'Given a string containing just the characters \'(\', \')\', \'{\', \'}\', \'[\' and \']\', determine if the input string is valid.',
      titleCustom: 'Evaluate Reverse Polish Notation',
      descCustom: 'Evaluate the value of an arithmetic expression in Reverse Polish Notation. Valid operators are +, -, *, and /.',
      difficulty: 'Medium',
      isMaster: false,
      handout: 'Day 3 Handout: Stack operations and token parsing.',
      solutionCode: '// Valid Parentheses (C++)\nbool isValid(string s) {\n    stack<char> st;\n    for(char c : s) {\n        if(c == \'(\' || c == \'{\' || c == \'[\') st.push(c);\n        else {\n            if(st.empty()) return false;\n            if(c == \')\' && st.top() != \'(\') return false;\n            if(c == \'}\' && st.top() != \'{\') return false;\n            if(c == \']\' && st.top() != \'[\') return false;\n            st.pop();\n        }\n    }\n    return st.empty();\n}'
    },
    {
      id: 'q-4',
      day: 4,
      titleLc: 'Merge Intervals',
      linkLc: 'https://leetcode.com/problems/merge-intervals/',
      descLc: 'Given an array of intervals where intervals[i] = [start_i, end_i], merge all overlapping intervals.',
      titleCustom: 'Insert Interval',
      descCustom: 'Insert a new interval into a sorted list of non-overlapping intervals, and merge overlaps if necessary.',
      difficulty: 'Medium',
      isMaster: false,
      handout: 'Day 4 Handout: Greedy intervals and sorting intervals by start point.',
      solutionCode: ''
    },
    {
      id: 'q-5',
      day: 5,
      titleLc: '3Sum',
      linkLc: 'https://leetcode.com/problems/3sum/',
      descLc: 'Find all unique triplets in the array that sum up to zero. No duplicate triplets allowed.',
      titleCustom: 'Container With Most Water',
      descCustom: 'Given n non-negative integers representing heights of vertical lines, find two lines that form a container containing the most water.',
      difficulty: 'Medium',
      isMaster: false,
      handout: 'Day 5 Handout: Two-pointer technique and shrinking search space.',
      solutionCode: ''
    },
    {
      id: 'q-6',
      day: 6,
      titleLc: 'Top K Frequent Elements',
      linkLc: 'https://leetcode.com/problems/top-k-frequent-elements/',
      descLc: 'Given an integer array nums and an integer k, return the k most frequent elements.',
      titleCustom: 'Kth Largest Element',
      descCustom: 'Find the kth largest element in an unsorted array. Note that it is the kth largest element in the sorted order, not the kth distinct element.',
      difficulty: 'Medium',
      isMaster: false,
      handout: 'Day 6 Handout: Heap/PriorityQueue concepts and bucket sort solutions.',
      solutionCode: ''
    },
    {
      id: 'q-7',
      day: 7,
      titleLc: 'Binary Tree Level Order Traversal',
      linkLc: 'https://leetcode.com/problems/binary-tree-level-order-traversal/',
      descLc: 'Given the root of a binary tree, return the level order traversal of its nodes\' values (i.e. from left to right, level by level).',
      titleCustom: 'Serialize and Deserialize Binary Tree',
      descCustom: 'Design an algorithm to serialize and deserialize a binary tree. There is no restriction on how your serialization/deserialization algorithm should work.',
      difficulty: 'Hard',
      isMaster: false,
      handout: 'Day 7 Handout: Tree traversal (BFS vs DFS) and custom parsing serialization formats.',
      solutionCode: ''
    },
    {
      id: 'q-8',
      day: 8,
      titleLc: 'Edit Distance',
      linkLc: 'https://leetcode.com/problems/edit-distance/',
      descLc: 'Given two strings word1 and word2, return the minimum number of operations required to convert word1 to word2.',
      titleCustom: 'Longest Common Subsequence',
      descCustom: 'Given two strings text1 and text2, return the length of their longest common subsequence. If there is no common subsequence, return 0.',
      difficulty: 'Medium',
      isMaster: false,
      handout: 'Day 8 Handout: Dynamic Programming introduction, matrix alignment.',
      solutionCode: ''
    },
    {
      id: 'q-9',
      day: 9,
      titleLc: 'Course Schedule',
      linkLc: 'https://leetcode.com/problems/course-schedule/',
      descLc: 'There are a total of numCourses courses you have to take, labeled from 0 to numCourses - 1. You are given prerequisites. Return true if you can finish all courses.',
      titleCustom: 'Course Schedule II',
      descCustom: 'Find the actual ordering of courses you should take to finish all courses. Return empty array if not possible.',
      difficulty: 'Medium',
      isMaster: false,
      handout: 'Day 9 Handout: Graphs, Kahn\'s Algorithm, and Topological Sorting DFS.',
      solutionCode: ''
    },
    {
      id: 'q-10',
      day: 10,
      titleLc: 'Longest Palindromic Substring',
      linkLc: 'https://leetcode.com/problems/longest-palindromic-substring/',
      descLc: 'Given a string s, return the longest palindromic substring in s.',
      titleCustom: 'Count Palindromic Substrings',
      descCustom: 'Given a string s, return the number of palindromic substrings in it.',
      difficulty: 'Medium',
      isMaster: false,
      handout: 'Day 10 Handout: Expanding around centers and Manacher\'s algorithm brief.',
      solutionCode: ''
    },
    {
      id: 'q-11',
      day: 11,
      titleLc: 'Implement Trie (Prefix Tree)',
      linkLc: 'https://leetcode.com/problems/implement-trie-prefix-tree/',
      descLc: 'A trie (pronounced as "try") or prefix tree is a tree data structure used to efficiently store and retrieve keys in a dataset of strings.',
      titleCustom: 'Word Search II',
      descCustom: 'Given an m x n board of characters and a list of strings words, return all words on the board using a Trie structure.',
      difficulty: 'Hard',
      isMaster: false,
      handout: 'Day 11 Handout: Advanced prefix structures and backtracking on matrices.',
      solutionCode: ''
    },
    {
      id: 'q-12',
      day: 12,
      titleLc: 'Subsets',
      linkLc: 'https://leetcode.com/problems/subsets/',
      descLc: 'Given an integer array nums of unique elements, return all possible subsets (the power set).',
      titleCustom: 'Permutations',
      descCustom: 'Given an array nums of distinct integers, return all the possible permutations. You can return the answer in any order.',
      difficulty: 'Medium',
      isMaster: false,
      handout: '',
      solutionCode: ''
    },
    {
      id: 'q-99',
      day: 99,
      titleLc: 'Binary Tree Maximum Path Sum',
      linkLc: 'https://leetcode.com/problems/binary-tree-maximum-path-sum/',
      descLc: 'A path in a binary tree is a sequence of nodes where each pair of adjacent nodes has an edge. Return the maximum path sum.',
      titleCustom: 'Merge k Sorted Lists',
      descCustom: 'Merge k sorted linked lists and return it as one sorted list. Analyze and describe its complexity.',
      difficulty: 'Hard',
      isMaster: true,
      handout: '',
      solutionCode: ''
    },
    {
      id: 'q-100',
      day: 100,
      titleLc: 'LRU Cache',
      linkLc: 'https://leetcode.com/problems/lru-cache/',
      descLc: 'Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.',
      titleCustom: 'Median of Two Sorted Arrays',
      descCustom: 'Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays. Time complexity must be O(log(m+n)).',
      difficulty: 'Hard',
      isMaster: true,
      handout: '',
      solutionCode: ''
    }
  ];

  // Seeding submissions
  // Seed User (user-1) and others for Days 1 to 10
  const submissions = [];
  const participants = users.filter(u => u.role === 'participant');

  // Helper to push submissions for a user
  const seedUserSubmissions = (user, upToDay) => {
    for (let d = 1; d <= upToDay; d++) {
      const q = questions.find(question => question.day === d);
      if (!q) continue;

      // 80% chance of successful on-time submission
      const rand = Math.random();
      if (rand < 0.85) {
        submissions.push({
          id: `sub-${user.id}-${d}-lc`,
          userId: user.id,
          questionId: q.id,
          day: d,
          type: 'leetcode',
          link: `https://github.com/${user.gitHubId}/100-days-of-code/blob/main/day${d}_leetcode.java`,
          lcLink: `https://leetcode.com/submissions/detail/1234567890/`,
          timestamp: new Date(`2026-05-${20 + d}T14:30:00Z`).toISOString(),
          status: 'Submitted',
          marks: Math.floor(Math.random() * 3) + 8, // 8, 9, 10
          gradedBy: 'admin-1',
          comments: 'Well structured and optimized code.'
        });
        submissions.push({
          id: `sub-${user.id}-${d}-custom`,
          userId: user.id,
          questionId: q.id,
          day: d,
          type: 'custom',
          link: `https://github.com/${user.gitHubId}/100-days-of-code/blob/main/day${d}_custom.java`,
          timestamp: new Date(`2026-05-${20 + d}T14:45:00Z`).toISOString(),
          status: 'Submitted',
          marks: Math.floor(Math.random() * 3) + 8, // 8, 9, 10
          gradedBy: 'admin-1',
          comments: 'Excellent logic.'
        });
      } else if (rand < 0.95) {
        // Late submission
        submissions.push({
          id: `sub-${user.id}-${d}-lc`,
          userId: user.id,
          questionId: q.id,
          day: d,
          type: 'leetcode',
          link: `https://github.com/${user.gitHubId}/100-days-of-code/blob/main/day${d}_leetcode.java`,
          lcLink: `https://leetcode.com/submissions/detail/1234567890/`,
          timestamp: new Date(`2026-05-${20 + d}T23:55:00Z`).toISOString(), // simulate late
          status: 'Late',
          marks: Math.floor(Math.random() * 3) + 5, // 5, 6, 7 (penalized)
          gradedBy: 'admin-1',
          comments: 'Submitted past 24 hrs. Points penalized.'
        });
        submissions.push({
          id: `sub-${user.id}-${d}-custom`,
          userId: user.id,
          questionId: q.id,
          day: d,
          type: 'custom',
          link: `https://github.com/${user.gitHubId}/100-days-of-code/blob/main/day${d}_custom.java`,
          timestamp: new Date(`2026-05-${20 + d}T23:58:00Z`).toISOString(),
          status: 'Late',
          marks: Math.floor(Math.random() * 3) + 5,
          gradedBy: 'admin-1',
          comments: 'Late submission.'
        });
      } else {
        // Missed
        submissions.push({
          id: `sub-${user.id}-${d}-lc`,
          userId: user.id,
          questionId: q.id,
          day: d,
          type: 'leetcode',
          link: '',
          timestamp: '',
          status: 'Missed',
          marks: 0,
          gradedBy: '',
          comments: ''
        });
        submissions.push({
          id: `sub-${user.id}-${d}-custom`,
          userId: user.id,
          questionId: q.id,
          day: d,
          type: 'custom',
          link: '',
          timestamp: '',
          status: 'Missed',
          marks: 0,
          gradedBy: '',
          comments: ''
        });
      }
    }
  };

  // Seed all users up to Day 10
  participants.forEach(p => seedUserSubmissions(p, 10));

  // Day 11 submissions are pending manual grading
  participants.forEach(p => {
    if (Math.random() < 0.9) {
      submissions.push({
        id: `sub-${p.id}-11-lc`,
        userId: p.id,
        questionId: 'q-11',
        day: 11,
        type: 'leetcode',
        link: `https://github.com/${p.gitHubId}/100-days-of-code/blob/main/day11_leetcode.java`,
        lcLink: `https://leetcode.com/submissions/detail/1234567890/`,
        timestamp: new Date(`2026-06-04T12:00:00Z`).toISOString(),
        status: 'Submitted',
        marks: null, // PENDING GRADING
        gradedBy: '',
        comments: ''
      });
      submissions.push({
        id: `sub-${p.id}-11-custom`,
        userId: p.id,
        questionId: 'q-11',
        day: 11,
        type: 'custom',
        link: `https://github.com/${p.gitHubId}/100-days-of-code/blob/main/day11_custom.java`,
        timestamp: new Date(`2026-06-04T12:15:00Z`).toISOString(),
        status: 'Submitted',
        marks: null, // PENDING GRADING
        gradedBy: '',
        comments: ''
      });
    }
  });

  // Mock Debugging Challenges
  const debuggingChallenges = [
    {
      id: 'debug-1',
      week: 1,
      theme: 'Memory Leak and BFS Traversal',
      description: 'Find and fix the memory leak in this BFS graph traversal. The visited set grows infinitely or has a bug that prevents node marking.',
      starterCode: 'void bfs(Node* root) {\n  if (!root) return;\n  queue<Node*> q;\n  q.push(root);\n  unordered_set<Node*> visited;\n  while (!q.empty()) {\n    Node* curr = q.front(); q.pop();\n    cout << curr->val << " ";\n    // Visited checklist logic missing!\n    for (Node* neighbor : curr->neighbors) {\n      q.push(neighbor);\n    }\n  }\n}',
      publishedDate: new Date('2026-05-24T21:00:00Z').toISOString(), // Week 1 Sunday
      submissions: participants.map(p => ({
        userId: p.id,
        link: `https://github.com/${p.gitHubId}/100-days-debug/blob/main/week1.cpp`,
        timestamp: new Date('2026-05-24T21:45:00Z').toISOString(),
        score: Math.floor(Math.random() * 5) + 15 // Score out of 20
      }))
    },
    {
      id: 'debug-2',
      week: 2,
      theme: 'Concurrency & Deadlocks',
      description: 'Identify the deadlock scenario in the thread synchronization resource allocations. Fix the locking order.',
      starterCode: 'void threadA() {\n  lock_guard<mutex> lock1(mutA);\n  this_thread::sleep_for(10ms);\n  lock_guard<mutex> lock2(mutB);\n  // Do work...\n}\n\nvoid threadB() {\n  lock_guard<mutex> lock1(mutB);\n  this_thread::sleep_for(10ms);\n  lock_guard<mutex> lock2(mutA);\n  // Do work...\n}',
      publishedDate: new Date('2026-05-31T21:00:00Z').toISOString(), // Week 2 Sunday
      submissions: participants.map(p => ({
        userId: p.id,
        link: `https://github.com/${p.gitHubId}/100-days-debug/blob/main/week2.cpp`,
        timestamp: new Date('2026-05-31T21:35:00Z').toISOString(),
        score: Math.floor(Math.random() * 5) + 15 // Score out of 20
      }))
    },
    {
      id: 'debug-3',
      week: 3,
      theme: 'Dynamic Programming Array Index OOB',
      description: 'Fix the index out of bound error in this Knapsack bottom-up solution. The table indices mismatch.',
      starterCode: 'int knapsack(vector<int>& wt, vector<int>& val, int W, int n) {\n  vector<vector<int>> dp(n + 1, vector<int>(W + 1, 0));\n  for (int i = 0; i <= n; i++) {\n    for (int w = 0; w <= W; w++) {\n      if (i == 0 || w == 0) dp[i][w] = 0;\n      else {\n        // Index error WT/VAL are 0-indexed!\n        dp[i][w] = max(dp[i-1][w], val[i] + dp[i-1][w - wt[i]]);\n      }\n    }\n  }\n  return dp[n][W];\n}',
      publishedDate: new Date('2026-06-07T21:00:00Z').toISOString(), // Next Sunday (future)
      submissions: []
    }
  ];

  return {
    users,
    questions,
    submissions,
    debuggingChallenges,
    currentDay: 12,
    simulatedTime: new Date('2026-06-05T15:47:39+05:30').toISOString() // initialized to current system date
  };
};

export const loadDB = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to parse DB, reloading initial', e);
    }
  }
  const initial = getInitialDB();
  saveDB(initial);
  return initial;
};

export const saveDB = (db) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
};

// Re-calculate rankings and update scores
export const updateLeaderboardsAndStreaks = (db) => {
  const codingScores = {};
  const debugScores = {};
  const participants = db.users.filter(u => u.role === 'participant');

  // Initialize
  participants.forEach(p => {
    codingScores[p.id] = 0;
    debugScores[p.id] = 0;
  });

  // Calculate Coding marks
  db.submissions.forEach(sub => {
    if (sub.status === 'Submitted' || sub.status === 'Late') {
      if (sub.marks != null) {
        codingScores[sub.userId] = (codingScores[sub.userId] || 0) + sub.marks;
      }
    }
  });

  // Calculate Debugging marks
  db.debuggingChallenges.forEach(challenge => {
    challenge.submissions.forEach(sub => {
      if (sub.score != null) {
        debugScores[sub.userId] = (debugScores[sub.userId] || 0) + sub.score;
      }
    });
  });

  // Update participant stats
  db.users = db.users.map(u => {
    if (u.role !== 'participant') return u;
    const codingScore = codingScores[u.id] || 0;
    const debugScore = debugScores[u.id] || 0;
    
    // Recalculate streak values from submission histories
    // Count consecutive days submitted on time
    let currentCodingStreak = 0;
    for (let d = db.currentDay - 1; d >= 1; d--) {
      const daySubs = db.submissions.filter(s => s.userId === u.id && s.day === d);
      // Both questions must be submitted and not missed/late
      const allSubmittedOnTime = daySubs.length === 2 && daySubs.every(s => s.status === 'Submitted');
      if (allSubmittedOnTime) {
        currentCodingStreak++;
      } else {
        break; // Streak broken
      }
    }

    return {
      ...u,
      totalCodingScore: codingScore,
      totalDebuggingScore: debugScore,
      gitHubStreak: currentCodingStreak
    };
  });

  // Sort and assign overall ranks
  const sortedParticipants = db.users
    .filter(u => u.role === 'participant')
    .sort((a, b) => {
      const scoreA = a.totalCodingScore + a.totalDebuggingScore;
      const scoreB = b.totalCodingScore + b.totalDebuggingScore;
      return scoreB - scoreA;
    });

  sortedParticipants.forEach((p, idx) => {
    const userIndex = db.users.findIndex(u => u.id === p.id);
    if (userIndex !== -1) {
      db.users[userIndex].overallRank = idx + 1;
    }
  });

  return db;
};
