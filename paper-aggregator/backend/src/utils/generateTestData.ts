import db from '../database/db';
import bcrypt from 'bcryptjs';

// Sample data
const sampleTitles = [
  "Efficient Zero-Knowledge Proofs for General Circuits",
  "Scalable Privacy-Preserving Blockchain Protocols",
  "Advanced Cryptographic Techniques for Secure Computation",
  "Novel Approaches to Consensus Mechanisms",
  "Homomorphic Encryption in Practice",
  "Quantum-Resistant Cryptographic Schemes",
  "Optimizing zk-SNARKs for Real-World Applications",
  "Privacy-Preserving Machine Learning with MPC",
  "Threshold Cryptography for Distributed Systems",
  "Post-Quantum Security in Blockchain Networks"
];

const sampleAuthors = [
  "Alice Johnson, Bob Smith",
  "Carol White, David Brown",
  "Eve Martinez, Frank Garcia",
  "Grace Lee, Henry Wang",
  "Ivy Chen, Jack Liu",
  "Karen Zhang, Leo Kim",
  "Mary Taylor, Nathan Anderson",
  "Olivia Moore, Paul Jackson",
  "Quinn Davis, Rachel Wilson",
  "Sam Miller, Tina Rodriguez"
];

const sampleTags = [
  "zero-knowledge", "cryptography", "blockchain", "privacy", "security",
  "zkp", "snark", "stark", "consensus", "distributed-systems",
  "mpc", "homomorphic-encryption", "post-quantum", "scalability"
];

const sampleAbstracts = [
  "This paper presents a novel approach to constructing efficient zero-knowledge proofs for general circuits with improved computational complexity.",
  "We introduce a scalable blockchain protocol that preserves user privacy while maintaining decentralization and security properties.",
  "This work explores advanced cryptographic techniques that enable secure multi-party computation in resource-constrained environments.",
  "We propose new consensus mechanisms that achieve better performance characteristics while maintaining Byzantine fault tolerance.",
  "Our research demonstrates practical applications of homomorphic encryption in real-world data processing scenarios."
];

const sampleComments = [
  "Great paper! The methodology is very clear and well-explained.",
  "Interesting approach, but I have some concerns about the complexity analysis in Section 3.",
  "This builds nicely on previous work by $Smith$ et al. The improvements are significant.",
  "Has anyone implemented this? I'd be curious to see performance benchmarks.",
  "The mathematical formulation in $$\\sum_{i=1}^{n} x_i$$ is elegant.",
  "Could this be extended to handle larger input sizes?",
  "The security proof seems sound, but what about side-channel attacks?",
  "Very relevant to my current research. Thanks for sharing!",
  "I wonder how this compares to the $\\mathcal{O}(n \\log n)$ algorithm proposed in [15].",
  "Impressive results. Looking forward to seeing the full implementation."
];

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomSubset<T>(array: T[], min: number = 1, max: number = 3): T[] {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function generateTestData() {
  console.log('🚀 Starting test data generation...\n');

  try {
    // Create test users
    console.log('👥 Creating test users...');
    const testUsers = [
      { username: 'alice', email: 'alice@test.com', password: 'password123' },
      { username: 'bob', email: 'bob@test.com', password: 'password123' },
      { username: 'carol', email: 'carol@test.com', password: 'password123' },
      { username: 'dave', email: 'dave@test.com', password: 'password123' },
      { username: 'eve', email: 'eve@test.com', password: 'password123' }
    ];

    const userIds: number[] = [];
    for (const user of testUsers) {
      try {
        const passwordHash = await bcrypt.hash(user.password, 10);
        const result = db.prepare(`
          INSERT INTO users (username, email, password_hash)
          VALUES (?, ?, ?)
        `).run(user.username, user.email, passwordHash);
        userIds.push(result.lastInsertRowid as number);
        console.log(`  ✓ Created user: ${user.username}`);
      } catch (err: any) {
        if (err.message.includes('UNIQUE constraint')) {
          const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(user.username) as any;
          if (existingUser) {
            userIds.push(existingUser.id);
            console.log(`  ↻ User already exists: ${user.username}`);
          }
        } else {
          throw err;
        }
      }
    }

    // Ensure all tags exist
    console.log('\n🏷️  Creating tags...');
    for (const tag of sampleTags) {
      db.prepare('INSERT OR IGNORE INTO tags (name) VALUES (?)').run(tag);
    }
    console.log(`  ✓ Created ${sampleTags.length} tags`);

    // Generate papers
    console.log('\n📄 Generating papers...');
    const paperCount = 50;
    const paperIds: number[] = [];
    const startDate = new Date('2024-01-01');
    const endDate = new Date();

    for (let i = 0; i < paperCount; i++) {
      const title = `${randomElement(sampleTitles)} - Study ${i + 1}`;
      const url = `https://example.com/papers/${i + 1}`;
      const authors = randomElement(sampleAuthors);
      const abstract = randomElement(sampleAbstracts);
      const submitterId = randomElement(userIds);
      const createdAt = randomDate(startDate, endDate);

      const result = db.prepare(`
        INSERT INTO papers (title, url, authors, abstract, submitter_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(title, url, authors, abstract, submitterId, createdAt.toISOString());

      const paperId = result.lastInsertRowid as number;
      paperIds.push(paperId);

      // Add random tags
      const paperTags = randomSubset(sampleTags, 2, 4);
      for (const tagName of paperTags) {
        const tag = db.prepare('SELECT id FROM tags WHERE name = ?').get(tagName) as any;
        db.prepare('INSERT INTO paper_tags (paper_id, tag_id) VALUES (?, ?)').run(paperId, tag.id);
      }

      // Add random votes
      const numVotes = Math.floor(Math.random() * 20);
      const voters = randomSubset(userIds, 0, Math.min(numVotes, userIds.length));
      for (const voterId of voters) {
        const voteType = Math.random() > 0.3 ? 1 : -1; // 70% upvotes
        try {
          db.prepare('INSERT INTO votes (user_id, paper_id, vote_type) VALUES (?, ?, ?)').run(voterId, paperId, voteType);
        } catch (err) {
          // Skip duplicate votes
        }
      }

      if ((i + 1) % 10 === 0) {
        console.log(`  ✓ Generated ${i + 1}/${paperCount} papers`);
      }
    }

    // Generate comments
    console.log('\n💬 Generating comments...');
    const commentCount = 150;
    const commentIds: number[] = [];

    for (let i = 0; i < commentCount; i++) {
      const paperId = randomElement(paperIds);
      const userId = randomElement(userIds);
      const content = randomElement(sampleComments);
      const createdAt = randomDate(startDate, endDate);

      const result = db.prepare(`
        INSERT INTO comments (paper_id, user_id, content, created_at)
        VALUES (?, ?, ?, ?)
      `).run(paperId, userId, content, createdAt.toISOString());

      commentIds.push(result.lastInsertRowid as number);

      if ((i + 1) % 30 === 0) {
        console.log(`  ✓ Generated ${i + 1}/${commentCount} comments`);
      }
    }

    // Generate some replies
    console.log('\n↩️  Generating comment replies...');
    const replyCount = 50;
    for (let i = 0; i < replyCount; i++) {
      const parentComment = db.prepare(`
        SELECT c.id, c.paper_id
        FROM comments c
        WHERE c.parent_id IS NULL
        ORDER BY RANDOM()
        LIMIT 1
      `).get() as any;

      if (parentComment) {
        const userId = randomElement(userIds);
        const content = randomElement(sampleComments);
        const createdAt = randomDate(startDate, endDate);

        db.prepare(`
          INSERT INTO comments (paper_id, user_id, parent_id, content, created_at)
          VALUES (?, ?, ?, ?, ?)
        `).run(parentComment.paper_id, userId, parentComment.id, content, createdAt.toISOString());
      }

      if ((i + 1) % 10 === 0) {
        console.log(`  ✓ Generated ${i + 1}/${replyCount} replies`);
      }
    }

    console.log('\n✅ Test data generation complete!\n');
    console.log('Summary:');
    console.log(`  - Users: ${userIds.length}`);
    console.log(`  - Papers: ${paperCount}`);
    console.log(`  - Comments: ${commentCount + replyCount}`);
    console.log(`  - Tags: ${sampleTags.length}`);
    console.log('\nTest user credentials:');
    console.log('  Username: alice, bob, carol, dave, or eve');
    console.log('  Password: password123');

  } catch (error) {
    console.error('❌ Error generating test data:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  generateTestData()
    .then(() => {
      console.log('\n🎉 Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export default generateTestData;
