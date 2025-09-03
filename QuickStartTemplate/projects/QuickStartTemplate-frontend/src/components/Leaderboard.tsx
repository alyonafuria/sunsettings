import React from 'react'

interface LeaderboardEntry {
  id: number
  username: string
  postImage: string
  likes: number
  rank: number
}

const Leaderboard: React.FC = () => {
  // Mock data for leaderboard entries
  const mockLeaderboard: LeaderboardEntry[] = [
    {
      id: 1,
      username: 'sunset_chaser',
      postImage: 'https://via.placeholder.com/400x400/FF6B6B/FFFFFF?text=Sunset+1',
      likes: 15234,
      rank: 1
    },
    {
      id: 2,
      username: 'golden_hour',
      postImage: 'https://via.placeholder.com/400x400/4ECDC4/FFFFFF?text=Sunset+2',
      likes: 12891,
      rank: 2
    },
    {
      id: 3,
      username: 'sky_painter',
      postImage: 'https://via.placeholder.com/400x400/45B7D1/FFFFFF?text=Sunset+3',
      likes: 11567,
      rank: 3
    },
    {
      id: 4,
      username: 'twilight_lover',
      postImage: 'https://via.placeholder.com/400x400/F7DC6F/FFFFFF?text=Sunset+4',
      likes: 10234,
      rank: 4
    },
    {
      id: 5,
      username: 'dusk_till_dawn',
      postImage: 'https://via.placeholder.com/400x400/BB8FCE/FFFFFF?text=Sunset+5',
      likes: 9876,
      rank: 5
    },
    {
      id: 6,
      username: 'horizon_hunter',
      postImage: 'https://via.placeholder.com/400x400/85C1E2/FFFFFF?text=Sunset+6',
      likes: 8543,
      rank: 6
    },
    {
      id: 7,
      username: 'color_burst',
      postImage: 'https://via.placeholder.com/400x400/F8B739/FFFFFF?text=Sunset+7',
      likes: 7892,
      rank: 7
    },
    {
      id: 8,
      username: 'evening_glow',
      postImage: 'https://via.placeholder.com/400x400/EC7063/FFFFFF?text=Sunset+8',
      likes: 6754,
      rank: 8
    },
    {
      id: 9,
      username: 'solar_flare',
      postImage: 'https://via.placeholder.com/400x400/A569BD/FFFFFF?text=Sunset+9',
      likes: 5432,
      rank: 9
    },
    {
      id: 10,
      username: 'afterglow',
      postImage: 'https://via.placeholder.com/400x400/58D68D/FFFFFF?text=Sunset+10',
      likes: 4567,
      rank: 10
    }
  ]

  const formatLikes = (likes: number): string => {
    if (likes >= 1000000) {
      return `${(likes / 1000000).toFixed(1)}M`
    } else if (likes >= 1000) {
      return `${(likes / 1000).toFixed(1)}K`
    }
    return likes.toString()
  }

  const getRankBadge = (rank: number) => {
    switch(rank) {
      case 1:
        return '🥇'
      case 2:
        return '🥈'
      case 3:
        return '🥉'
      default:
        return `#${rank}`
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-red-500 to-purple-600">
      <div className="container mx-auto px-4 py-6">
        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Sunset Leaderboard
          </h1>
        </div>

        {/* Leaderboard List */}
        <div className="max-w-4xl mx-auto space-y-3">
          {mockLeaderboard.map((entry) => (
            <div
              key={entry.id}
              className={`bg-white/95 backdrop-blur-lg rounded-xl overflow-hidden shadow-lg hover:shadow-xl transform transition-all duration-300 ${
                entry.rank <= 3 ? 'ring-2 ring-yellow-400/50' : ''
              }`}
            >
              <div className="flex items-center p-3 gap-4">
                {/* Rank Badge */}
                <div className="flex-shrink-0 w-12 text-center">
                  <div className="text-2xl font-bold">
                    {getRankBadge(entry.rank)}
                  </div>
                </div>

                {/* Post Image Thumbnail */}
                <div className="flex-shrink-0">
                  <img
                    src={entry.postImage}
                    alt={`Sunset by ${entry.username}`}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                </div>

                {/* User Info and Stats */}
                <div className="flex-grow">
                  <div className="flex items-center gap-3 mb-1">
                    
                    {/* Username */}
                    <span className="font-semibold text-gray-800">
                      {entry.username}
                    </span>

                    {/* Top post badge for #1 */}
                    {entry.rank === 1 && (
                      <span className="text-xs bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-0.5 rounded-full">
                        READY TO MINT
                      </span>
                    )}
                  </div>

                  {/* Caption preview */}
                  <p className="text-sm text-gray-600 mb-1">
                    Beautiful sunset captured today! 🌅
                  </p>

                  {/* Stats row */}
                  <div className="flex items-center gap-6 text-sm">
                    {/* Likes */}
                    <div className="flex items-center gap-1">
                      <svg 
                        className="w-4 h-4 text-red-500 fill-current"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                      </svg>
                      <span className="font-semibold text-gray-700">
                        {formatLikes(entry.likes)}
                      </span>
                    </div>


                  </div>
                </div>

                
              </div>
            </div>
          ))}
        </div>

        {/* Load More Button */}
        <div className="text-center mt-8">
          <button className="px-6 py-2 bg-white/20 backdrop-blur-md text-white font-medium rounded-full border border-white/30 hover:bg-white/30 transform hover:scale-105 transition-all duration-300">
            Load More Posts
          </button>
        </div>
      </div>
    </div>
  )
}

export default Leaderboard