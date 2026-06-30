import styles from "./page.module.css";

export default function Home() {
  return (
    <>



<header className={styles['nav']}>
  <div className={styles['wrap'] + " " + styles['nav-in']}>
    <a className={styles['brand']}><span className={styles['mark']}>CV</span> CodeVault</a>
    <nav className={styles['nav-links']} id="navLinks">
      <a href="#problem">Problem</a>
      <a href="#dashboard">Dashboard</a>
      <a href="#sync">GitHub Sync</a>
      <a href="#profile">Profile</a>
      <a href="#faq">FAQ</a>
    </nav>
    <div className={styles['nav-right']}>
      <a className={styles['btn'] + " " + styles['btn-ghost']} href="/login">Sign in</a>
      <a className={styles['btn'] + " " + styles['btn-primary']} href="/login">Connect Accounts</a>
      <button className={styles['menu-btn']} type="button" id="menuBtn" aria-label="Toggle menu" aria-expanded="false" aria-controls="navLinks"><span></span></button>
    </div>
  </div>
</header>


<section className={styles['hero']}>
  <div className={styles['wrap']}>
    <span className={styles['eyebrow']}><span className={styles['dot']}></span> For competitive programmers</span>
    <h1>You've solved 1,000+ problems.<br/><span className={styles['dim']}>Nothing online proves it.</span></h1>
    <p className={styles['sub']}>CodeVault pulls your stats from LeetCode, Codeforces, CodeChef and HackerRank into one dashboard — and pushes every accepted solution to GitHub, organized by problem number.</p>
    <div className={styles['cta']}>
      <a className={styles['btn'] + " " + styles['btn-primary']} href="/login">Connect Accounts</a>
      <a className={styles['btn'] + " " + styles['btn-secondary']} href="#dashboard">View live demo</a>
    </div>
    <div className={styles['note']}>
      <span><span className={styles['tick']}>✓</span> No browser extension</span>
      <span><span className={styles['tick']}>✓</span> Your code stays private to you</span>
      <span><span className={styles['tick']}>✓</span> Free to start</span>
    </div>
    <div className={styles['hero-plats']} aria-label="Supported platforms">
      <span className={styles['hp']}><span className={styles['hpb'] + " " + styles['lc']}>LC</span> LeetCode</span>
      <span className={styles['hp']}><span className={styles['hpb'] + " " + styles['cf']}>CF</span> Codeforces</span>
      <span className={styles['hp']}><span className={styles['hpb'] + " " + styles['cc']}>CC</span> CodeChef</span>
      <span className={styles['hp']}><span className={styles['hpb'] + " " + styles['hr']}>HR</span> HackerRank</span>
      <span className={styles['hp'] + " " + styles['more']}>+ more soon</span>
    </div>

    
    <div className={styles['window']}>
      <div className={styles['win-bar']}>
        <div className={styles['win-dots']}><i></i><i></i><i></i></div>
        <div className={styles['win-url']}>app.codevault.dev/dashboard</div>
      </div>
      <div className={styles['win-body']}>
        <div className={styles['dash']}>
          <div className={styles['card'] + " " + styles['span2']}>
            <div className={styles['ch']}>Problems solved <span className={styles['tag']}>all platforms</span></div>
            <div className={styles['big-num']}>1,248</div>
            <div className={styles['delta']}>+37 this week · 47-day streak</div>
            <div style={{ marginTop: '16px' }} className={styles['pf']}>
              <div className={styles['pf-row']}><span className={styles['lab']}><span className={styles['badge-ic'] + " " + styles['lc']}>LC</span>LeetCode</span><span className={styles['pf-bar']}><i className={styles['lc']} style={{ width: '100%' }}></i></span><span className={styles['val']}>612</span></div>
              <div className={styles['pf-row']}><span className={styles['lab']}><span className={styles['badge-ic'] + " " + styles['cf']}>CF</span>Codeforces</span><span className={styles['pf-bar']}><i className={styles['cf']} style={{ width: '56%' }}></i></span><span className={styles['val']}>341</span></div>
              <div className={styles['pf-row']}><span className={styles['lab']}><span className={styles['badge-ic'] + " " + styles['cc']}>CC</span>CodeChef</span><span className={styles['pf-bar']}><i className={styles['cc']} style={{ width: '30%' }}></i></span><span className={styles['val']}>184</span></div>
              <div className={styles['pf-row']}><span className={styles['lab']}><span className={styles['badge-ic'] + " " + styles['hr']}>HR</span>HackerRank</span><span className={styles['pf-bar']}><i className={styles['hr']} style={{ width: '18%' }}></i></span><span className={styles['val']}>111</span></div>
            </div>
          </div>
          <div className={styles['card']}>
            <div className={styles['ch']}>Difficulty</div>
            <div className={styles['diff']} style={{ flexDirection: 'column', gap: '8px' }}>
              <div className={styles['d'] + " " + styles['easy']}><div className={styles['n']}>540</div><div className={styles['l']}>Easy</div></div>
              <div className={styles['d'] + " " + styles['med']}><div className={styles['n']}>560</div><div className={styles['l']}>Medium</div></div>
              <div className={styles['d'] + " " + styles['hard']}><div className={styles['n']}>148</div><div className={styles['l']}>Hard</div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>


<section id="problem">
  <div className={styles['wrap']}>
    <div className={styles['center'] + " " + styles['lede']}>
      <span className={styles['eyebrow'] + " " + styles['sec-eyebrow']}>The problem</span>
      <h2 className={styles['title']}>Your practice is everywhere. Your proof of work is nowhere.</h2>
      <p className={styles['sec-sub']}>You grind problems for months. Then someone asks "what have you built?" and you've got four profiles, no code, and a number nobody can verify.</p>
    </div>
    <div className={styles['prob-grid']}>
      <div className={styles['prob']}>
        <div className={styles['pc']}>// four tabs, four numbers</div>
        <h3>Progress lives in four different tabs</h3>
        <p>LeetCode has one count, Codeforces has a rating, CodeChef has stars, HackerRank has badges. There's no single place that says how much you've actually done.</p>
      </div>
      <div className={styles['prob']}>
        <div className={styles['pc']}>// git log --oneline → (empty)</div>
        <h3>Your GitHub doesn't show any of it</h3>
        <p>You've spent weeks on DP and graphs, but your contribution graph is grey. The work you're proudest of leaves no trace where people actually look.</p>
      </div>
      <div className={styles['prob']}>
        <div className={styles['pc']}>// "trust me, I solved 800"</div>
        <h3>Recruiters can't verify your problem-solving</h3>
        <p>A LeetCode profile rarely makes it onto a resume, and "solved 800 problems" is just a claim until someone can open the solutions and see how you think.</p>
      </div>
      <div className={styles['prob']}>
        <div className={styles['pc']}>// 3 years of effort, 0 artifacts</div>
        <h3>Years of effort, nothing to point to</h3>
        <p>When it's time to show your work — for a job, an internship, or just to look back — there's no single thing you can link that represents all of it.</p>
      </div>
    </div>
  </div>
</section>


<section id="solution" style={{ background: 'var(--subtle)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
  <div className={styles['wrap']}>
    <div className={styles['center'] + " " + styles['lede']}>
      <span className={styles['eyebrow'] + " " + styles['sec-eyebrow']}>How CodeVault solves it</span>
      <h2 className={styles['title']}>Connect once. Everything else is automatic.</h2>
      <p className={styles['sec-sub']}>You keep solving problems the way you already do. CodeVault turns that effort into a dashboard you can read and a repo you can share.</p>
    </div>
    <div className={styles['sol-grid']}>
      <div className={styles['sol']}><div className={styles['si']}>01</div><h3>Connect your profiles</h3><p>Add your handles for LeetCode, Codeforces, CodeChef and HackerRank. Stats start showing immediately.</p></div>
      <div className={styles['sol']}><div className={styles['si']}>02</div><h3>Stats stay current on their own</h3><p>CodeVault keeps your counts, ratings and solved lists in sync — you never update a spreadsheet again.</p></div>
      <div className={styles['sol']}><div className={styles['si']}>03</div><h3>One set of analytics</h3><p>See your real totals across every platform: difficulty mix, topic strengths, streaks, and a single submission heatmap.</p></div>
      <div className={styles['sol']}><div className={styles['si']}>04</div><h3>Solutions land in GitHub</h3><p>Every accepted submission is committed to your repo, organized by problem number, with the question and your code.</p></div>
      <div className={styles['sol']}><div className={styles['si']}>05</div><h3>A profile you can send</h3><p>Get one public link that shows your whole coding journey — ready to drop into a resume or a recruiter chat.</p></div>
      <div className={styles['sol']}><div className={styles['si']}>06</div><h3>You stay in control</h3><p>Disconnect any platform anytime. Your code is only ever your own, accessed with your permission.</p></div>
    </div>
  </div>
</section>


<section id="dashboard">
  <div className={styles['wrap']}>
    <div className={styles['center'] + " " + styles['lede']}>
      <span className={styles['eyebrow'] + " " + styles['sec-eyebrow']}>The dashboard</span>
      <h2 className={styles['title']}>Everything you've solved, in one screen</h2>
      <p className={styles['sec-sub']}>An example dashboard with realistic, self-consistent numbers — the view you'd open every day.</p>
    </div>

    <div className={styles['window']}>
      <div className={styles['win-bar']}>
        <div className={styles['win-dots']}><i></i><i></i><i></i></div>
        <div className={styles['win-url']}>app.codevault.dev/dashboard</div>
      </div>
      <div className={styles['win-body']}>
        <div className={styles['dash']}>
          
          <div className={styles['card']}>
            <div className={styles['ch']}>Total solved</div>
            <div className={styles['big-num']}>1,248</div>
            <div className={styles['delta']}>+37 this week</div>
          </div>
          
          <div className={styles['card']}>
            <div className={styles['ch']}>Streak</div>
            <div className={styles['streak']}>
              <div className={styles['s']}><div className={styles['n']}><span className={styles['fire']}>🔥</span> 47</div><div className={styles['l']}>Current days</div></div>
              <div className={styles['s']}><div className={styles['n']}>89</div><div className={styles['l']}>Longest</div></div>
            </div>
          </div>
          
          <div className={styles['card']}>
            <div className={styles['ch']}>Difficulty</div>
            <div className={styles['diff']}>
              <div className={styles['d'] + " " + styles['easy']}><div className={styles['n']}>540</div><div className={styles['l']}>Easy</div></div>
              <div className={styles['d'] + " " + styles['med']}><div className={styles['n']}>560</div><div className={styles['l']}>Med</div></div>
              <div className={styles['d'] + " " + styles['hard']}><div className={styles['n']}>148</div><div className={styles['l']}>Hard</div></div>
            </div>
          </div>

          
          <div className={styles['card'] + " " + styles['span2']}>
            <div className={styles['ch']}>Platform breakdown</div>
            <div className={styles['pf']}>
              <div className={styles['pf-row']}><span className={styles['lab']}><span className={styles['badge-ic'] + " " + styles['lc']}>LC</span>LeetCode</span><span className={styles['pf-bar']}><i className={styles['lc']} style={{ width: '100%' }}></i></span><span className={styles['val']}>612</span></div>
              <div className={styles['pf-row']}><span className={styles['lab']}><span className={styles['badge-ic'] + " " + styles['cf']}>CF</span>Codeforces</span><span className={styles['pf-bar']}><i className={styles['cf']} style={{ width: '56%' }}></i></span><span className={styles['val']}>341</span></div>
              <div className={styles['pf-row']}><span className={styles['lab']}><span className={styles['badge-ic'] + " " + styles['cc']}>CC</span>CodeChef</span><span className={styles['pf-bar']}><i className={styles['cc']} style={{ width: '30%' }}></i></span><span className={styles['val']}>184</span></div>
              <div className={styles['pf-row']}><span className={styles['lab']}><span className={styles['badge-ic'] + " " + styles['hr']}>HR</span>HackerRank</span><span className={styles['pf-bar']}><i className={styles['hr']} style={{ width: '18%' }}></i></span><span className={styles['val']}>111</span></div>
            </div>
          </div>
          
          <div className={styles['card']}>
            <div className={styles['ch']}>Topic strengths</div>
            <div className={styles['chips']}>
              <span className={styles['chip']}>Arrays <b>210</b></span>
              <span className={styles['chip']}>DP <b>142</b></span>
              <span className={styles['chip']}>Graphs <b>118</b></span>
              <span className={styles['chip']}>Trees <b>96</b></span>
              <span className={styles['chip']}>Greedy <b>84</b></span>
              <span className={styles['chip']}>Binary Search <b>71</b></span>
            </div>
          </div>

          
          <div className={styles['card'] + " " + styles['span2']}>
            <div className={styles['ch']}>Submission activity <span className={styles['tag']}>last 12 months</span></div>
            <div className={styles['heat']} id="heat" role="img" aria-label="Submission activity heatmap (last 12 months)" aria-hidden="true"></div>
            <div className={styles['heat-legend']}>Less <i style={{ background: '#efe7df' }}></i><i style={{ background: '#fbd6c6' }}></i><i style={{ background: '#f5a888' }}></i><i style={{ background: '#f0764f' }}></i><i style={{ background: '#d8431f' }}></i> More</div>
          </div>
          
          <div className={styles['card']}>
            <div className={styles['ch']}>Recent activity</div>
            <div className={styles['act']}>
              <div className={styles['act-row']}><span className={styles['ic'] + " " + styles['lc']}></span><span className={styles['t']}><div className={styles['n']}>Plus One Linked List</div><div className={styles['m']}>LeetCode 369 · 2h ago</div></span><span className={styles['pill-d'] + " " + styles['med']}>Med</span></div>
              <div className={styles['act-row']}><span className={styles['ic'] + " " + styles['hr']}></span><span className={styles['t']}><div className={styles['n']}>Dijkstra: Shortest Reach</div><div className={styles['m']}>HackerRank · 5h ago</div></span><span className={styles['pill-d'] + " " + styles['hard']}>Hard</span></div>
              <div className={styles['act-row']}><span className={styles['ic'] + " " + styles['cf']}></span><span className={styles['t']}><div className={styles['n']}>Edu Round 168 — C</div><div className={styles['m']}>Codeforces · 1d ago</div></span><span className={styles['pill-d'] + " " + styles['rate']}>1400</span></div>
              <div className={styles['act-row']}><span className={styles['ic'] + " " + styles['cc']}></span><span className={styles['t']}><div className={styles['n']}>Chef and Subarrays</div><div className={styles['m']}>CodeChef · 1d ago</div></span><span className={styles['pill-d'] + " " + styles['easy']}>Easy</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>


<section id="sync" style={{ background: 'var(--subtle)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
  <div className={styles['wrap']}>
    <div className={styles['center'] + " " + styles['lede']}>
      <span className={styles['eyebrow'] + " " + styles['sec-eyebrow']}>GitHub sync</span>
      <h2 className={styles['title']}>Solve it once. It's in your repo.</h2>
      <p className={styles['sec-sub']}>The moment a submission is accepted, CodeVault detects it and commits it — no manual copy-paste.</p>
    </div>

    <div className={styles['flow']}>
      <div className={styles['step']}><div className={styles['k']}>step 1</div><div className={styles['v']}>Solve LeetCode 369</div><div className={styles['arrow']}>→</div></div>
      <div className={styles['step']}><div className={styles['k']}>step 2</div><div className={styles['v']}><span className={styles['ok']}>●</span> Accepted</div><div className={styles['arrow']}>→</div></div>
      <div className={styles['step']}><div className={styles['k']}>step 3</div><div className={styles['v']}>CodeVault detects it</div><div className={styles['arrow']}>→</div></div>
      <div className={styles['step']}><div className={styles['k']}>step 4</div><div className={styles['v']}><span className={styles['ok']}>✓</span> GitHub updated</div></div>
    </div>

    <div className={styles['repo-wrap']}>
      <div className={styles['repo']}>
        <div><span className={styles['fld']}>LeetCodeQuestions/</span></div>
        <div>├── <span className={styles['cmt']}>README.md</span></div>
        <div>├── <span className={styles['fld']}>0369/</span></div>
        <div>│&nbsp;&nbsp;├── <span className={styles['q']}>question.md</span></div>
        <div>│&nbsp;&nbsp;└── <span className={styles['s']}>solution.py</span></div>
        <div>└── <span className={styles['fld']}>0704/</span></div>
        <div>&nbsp;&nbsp;&nbsp;├── <span className={styles['q']}>question.md</span></div>
        <div>&nbsp;&nbsp;&nbsp;└── <span className={styles['s']}>solution.cpp</span></div>
      </div>
      <div className={styles['repo-note']}>
        <h3>Organized so people can actually read it</h3>
        <ul>
          <li><span className={styles['tick']}>✓</span> One folder per problem, named by its number — sorts naturally.</li>
          <li><span className={styles['tick']}>✓</span> <span className={styles['mono']}>question.md</span> holds the statement, difficulty, tags and link.</li>
          <li><span className={styles['tick']}>✓</span> <span className={styles['mono']}>solution.&lt;ext&gt;</span> is your accepted code, in the language you used.</li>
          <li><span className={styles['tick']}>✓</span> A top-level README indexes every problem you've solved.</li>
        </ul>
      </div>
    </div>
  </div>
</section>


<section id="profile">
  <div className={styles['wrap']}>
    <div className={styles['center'] + " " + styles['lede']}>
      <span className={styles['eyebrow'] + " " + styles['sec-eyebrow']}>Public profile</span>
      <h2 className={styles['title']}>One link. Your entire coding journey.</h2>
      <p className={styles['sec-sub']}>Send it to a recruiter, put it on your resume, pin it in your bio. It works across every platform you've connected.</p>
    </div>

    <div className={styles['profile-card']}>
      <div className={styles['pc-top']}>
        <div className={styles['pc-av']}>G</div>
        <div className={styles['pc-id']}>
          <div className={styles['nm']}>Gaurav Teegulla</div>
          <div className={styles['ln']}>codevault.dev/u/gaurav</div>
        </div>
        <button className={styles['btn'] + " " + styles['btn-secondary'] + " " + styles['pc-link']} id="copyBtn">Copy link</button>
      </div>
      <div className={styles['pc-stats']}>
        <div className={styles['st']}><div className={styles['n']}>1,248</div><div className={styles['l']}>Solved</div></div>
        <div className={styles['st']}><div className={styles['n']}>4</div><div className={styles['l']}>Platforms</div></div>
        <div className={styles['st']}><div className={styles['n']}>148</div><div className={styles['l']}>Hard</div></div>
        <div className={styles['st']}><div className={styles['n']}>89</div><div className={styles['l']}>Best streak</div></div>
      </div>
    </div>
    <p className={styles['center'] + " " + styles['muted']} style={{ marginTop: '18px', fontSize: '14px' }}>Recruiter-friendly, portfolio-ready, and always up to date.</p>
  </div>
</section>


<section id="how" style={{ background: 'var(--subtle)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
  <div className={styles['wrap']}>
    <div className={styles['center'] + " " + styles['lede']}>
      <span className={styles['eyebrow'] + " " + styles['sec-eyebrow']}>How it works</span>
      <h2 className={styles['title']}>Three steps, then you forget it exists</h2>
    </div>
    <div className={styles['how']}>
      <div className={styles['h']}><div className={styles['n']}>1</div><h3>Add your usernames</h3><p>Paste your handles. Public stats appear right away — no authorization needed just to see your numbers.</p></div>
      <div className={styles['h']}><div className={styles['n']}>2</div><h3>Authorize sync once</h3><p>Grant access a single time so CodeVault can read your own accepted submissions and push them to GitHub.</p></div>
      <div className={styles['h']}><div className={styles['n']}>3</div><h3>Keep solving</h3><p>Every accepted problem updates your dashboard and lands in your repo automatically. Nothing else to do.</p></div>
    </div>
  </div>
</section>


<section id="founder">
  <div className={styles['wrap']}>
    <div className={styles['center'] + " " + styles['lede']}>
      <span className={styles['eyebrow'] + " " + styles['sec-eyebrow']}>Why I built this</span>
      <h2 className={styles['title']}>I got tired of having nothing to show</h2>
    </div>
    <div className={styles['founder']}>
      <p>I'd been solving problems for years — LeetCode at night, the odd Codeforces round on weekends, CodeChef long challenges, HackerRank for interview prep. The progress was real, but it was scattered across four accounts.</p>
      <p>When I went to put it on a resume, I realized I had nothing concrete. My GitHub didn't reflect any of it. "I've solved a lot of problems" isn't something you can link to. The work existed; the proof didn't.</p>
      <p>So I built CodeVault for myself first: one dashboard to see everything, and a GitHub repo that fills itself in as I solve. If you've felt the same gap between effort and evidence, it's for you too.</p>
      <div className={styles['sig']}>
        <div className={styles['av']}>G</div>
        <div className={styles['who']}><b>Gaurav Teegulla</b><span>Building CodeVault</span></div>
      </div>
    </div>
  </div>
</section>


<section id="faq" style={{ background: 'var(--subtle)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
  <div className={styles['wrap']}>
    <div className={styles['center'] + " " + styles['lede']}>
      <span className={styles['eyebrow'] + " " + styles['sec-eyebrow']}>FAQ</span>
      <h2 className={styles['title']}>Questions, answered plainly</h2>
    </div>
    <div className={styles['faq']} id="faqList">
      <div className={styles['qa']}><button>How does the GitHub sync work?<span className={styles['pm']}>+</span></button><div className={styles['ans']}><p>CodeVault checks your connected accounts for newly accepted submissions, fetches the code and problem statement, then commits a folder named by the problem number to your repo via the GitHub API.</p></div></div>
      <div className={styles['qa']}><button>Is my code private?<span className={styles['pm']}>+</span></button><div className={styles['ans']}><p>Your solution code is only accessed for your own account, with your authorization, and pushed to a repo you own. You decide if that repo is public or private.</p></div></div>
      <div className={styles['qa']}><button>Why is authorization needed?<span className={styles['pm']}>+</span></button><div className={styles['ans']}><p>Submitted source code is private on every platform — a username alone can't reach it. A one-time authorized connection lets CodeVault read only your own submissions.</p></div></div>
      <div className={styles['qa']}><button>Which platforms are supported?<span className={styles['pm']}>+</span></button><div className={styles['ans']}><p>LeetCode, Codeforces, CodeChef and HackerRank at launch. More platforms are planned, and each new one is added as a single integration.</p></div></div>
      <div className={styles['qa']}><button>Can I disconnect accounts?<span className={styles['pm']}>+</span></button><div className={styles['ans']}><p>Yes, anytime, from your settings. Disconnecting stops all future syncing for that platform immediately.</p></div></div>
      <div className={styles['qa']}><button>Is the dashboard public?<span className={styles['pm']}>+</span></button><div className={styles['ans']}><p>Your full dashboard is private to you. You can optionally enable a public profile at <span className={styles['mono']}>/u/your-name</span> that shows aggregated stats only.</p></div></div>
      <div className={styles['qa']}><button>How often does sync happen?<span className={styles['pm']}>+</span></button><div className={styles['ans']}><p>Sync runs on a schedule (a few times a day) and can be triggered manually. Stats refresh from public data; code syncs when a session is authorized and valid.</p></div></div>
    </div>
  </div>
</section>


<section id="cta">
  <div className={styles['wrap']}>
    <div className={styles['final']}>
      <h2>Turn the problems you solve into proof</h2>
      <p>Connect your accounts and let your dashboard and GitHub fill themselves in.</p>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <a className={styles['btn'] + " " + styles['btn-primary']} href="/login">Connect Accounts</a>
        <a className={styles['btn'] + " " + styles['btn-secondary']} href="#dashboard">View live demo</a>
      </div>
    </div>
  </div>
</section>


<footer>
  <div className={styles['wrap']}>
    <div className={styles['foot']}>
      <div className={styles['col'] + " " + styles['about']}>
        <a className={styles['brand']}><span className={styles['mark']}>CV</span> CodeVault</a>
        <p>One dashboard for your competitive programming, automatically synced to GitHub.</p>
      </div>
      <div className={styles['col']}><h4>Product</h4><a href="#dashboard">Dashboard</a><a href="#sync">GitHub Sync</a><a href="#profile">Public Profile</a><a href="#how">How it works</a></div>
      <div className={styles['col']}><h4>Platforms</h4><a href="#">LeetCode</a><a href="#">Codeforces</a><a href="#">CodeChef</a><a href="#">HackerRank</a></div>
      <div className={styles['col']}><h4>Company</h4><a href="#founder">About</a><a href="#faq">FAQ</a><a href="#">Privacy</a><a href="#">Contact</a></div>
    </div>
    <div className={styles['foot-bottom']}>
      <span>© 2026 CodeVault</span>
      <span>Sample landing page · built for developers</span>
    </div>
  </div>
</footer>



    </>
  );
}
