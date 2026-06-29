import React from "react";

export function RecentActivity() {
  return (
    <div className="panel span2">
      <div className="h">Recent Activity</div>
      <table>
        <thead>
          <tr>
            <th>Problem</th>
            <th>Platform</th>
            <th>Difficulty</th>
            <th>Result</th>
            <th>Date</th>
            <th className="tright">GitHub</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="prob-name">Two Sum</td>
            <td><div className="src"><div className="badge-ic lc">LC</div> LeetCode</div></td>
            <td><span className="pill-d easy">Easy</span></td>
            <td className="verd">Accepted</td>
            <td className="tright">2 hrs ago</td>
            <td className="tright"><a href="#" className="gh-link">gaurav/sync#1</a></td>
          </tr>
          <tr>
            <td className="prob-name">Watermelon</td>
            <td><div className="src"><div className="badge-ic cf">CF</div> Codeforces</div></td>
            <td><span className="pill-d rate">800</span></td>
            <td className="verd">Accepted</td>
            <td className="tright">Yesterday</td>
            <td className="tright"><a href="#" className="gh-link">gaurav/sync#4a</a></td>
          </tr>
          <tr>
            <td className="prob-name">Merge K Sorted Lists</td>
            <td><div className="src"><div className="badge-ic lc">LC</div> LeetCode</div></td>
            <td><span className="pill-d hard">Hard</span></td>
            <td className="verd">Accepted</td>
            <td className="tright">May 2</td>
            <td className="tright"><a href="#" className="gh-link">gaurav/sync#23</a></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
