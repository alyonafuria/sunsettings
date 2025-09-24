import React, { useState } from 'react'
import Transact from '../wallet/Transact'

interface LeaderboardEntry {
  id: number
  username: string
  postImage: string
  likes: number
  rank: number
}

const Leaderboard: React.FC = () => {
  const [openPaymentModalId, setOpenPaymentModalId] = useState<number | null>(null)
  const [showToast, setShowToast] = useState(false)

  // Mock data for leaderboard entries with individual images
  const mockLeaderboard: LeaderboardEntry[] = [
    {
      id: 1,
      username: 'MKZTQW...7XFA',
      postImage: 'https://cdn.pixabay.com/photo/2024/01/18/10/07/sunset-8516639_1280.jpg',
      likes: 15234,
      rank: 1,
    },
    {
      id: 2,
      username: 'LQNRDV...PZ3M',
      postImage: 'https://cdn.pixabay.com/photo/2022/08/10/18/57/lake-7377942_1280.jpg',
      likes: 12891,
      rank: 2,
    },
    {
      id: 3,
      username: 'XWJH6C...K5U',
      postImage: 'https://cdn.pixabay.com/photo/2022/08/06/15/39/city-7368852_1280.jpg',
      likes: 11567,
      rank: 3,
    },
    {
      id: 4,
      username: 'TRG7PQ...M2NL',
      postImage: 'https://cdn.pixabay.com/photo/2014/05/02/12/43/clouds-335969_1280.jpg',
      likes: 10234,
      rank: 4,
    },
    {
      id: 5,
      username: 'ZF4YQX...H9VA',
      postImage: 'https://cdn.pixabay.com/photo/2022/01/03/05/45/sunset-6911736_1280.jpg',
      likes: 9876,
      rank: 5,
    },
    {
      id: 6,
      username: 'BQ2LNS...7KEG',
      postImage: 'https://cdn.pixabay.com/photo/2024/12/20/18/31/sunset-9280759_1280.jpg',
      likes: 8543,
      rank: 6,
    },
    {
      id: 7,
      username: 'HCMX5R...QYUT',
      postImage: 'https://cdn.pixabay.com/photo/2022/09/01/09/31/sunset-glow-7425170_1280.jpg',
      likes: 7892,
      rank: 7,
    },
    {
      id: 8,
      username: 'PWJ3KZ...D6RF',
      postImage: 'https://cdn.pixabay.com/photo/2016/09/01/19/43/sunset-1637376_1280.jpg',
      likes: 6754,
      rank: 8,
    },
    {
      id: 9,
      username: 'KUV2QA...T3LP',
      postImage: 'https://cdn.pixabay.com/photo/2015/08/30/11/16/sunset-914148_1280.jpg',
      likes: 5432,
      rank: 9,
    },
    {
      id: 10,
      username: 'hSY2DB...R3TV',
      postImage: 'https://cdn.pixabay.com/photo/2013/08/26/09/40/silhouette-175970_1280.jpg',
      likes: 4567,
      rank: 10,
    },
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
    switch (rank) {
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

  const handleLoadMoreClick = () => {
    setShowToast(true)
    // Auto-hide toast after 3 seconds
    setTimeout(() => {
      setShowToast(false)
    }, 3000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-red-500 to-purple-600">
      <div className="container mx-auto px-4 py-6">
        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-700 to-yellow-700">
            Sunset Leaderboard
          </h1>
        </div>

        {/* Leaderboard List */}
        <div className="w-full max-w-2xl mx-auto space-y-3 px-2 sm:px-4">
          {mockLeaderboard.map((entry) => (
            <div
              key={entry.id}
              className={`bg-orange-200 backdrop-blur-lg rounded-xl overflow-hidden shadow-lg hover:shadow-xl transform transition-all duration-300 ${
                entry.rank <= 3 ? 'ring-2 ring-yellow-400/50' : ''
              }`}
            >
              <div className="flex items-center p-2 sm:p-3 gap-2 sm:gap-4">
                {/* Rank Badge */}
                <div className="flex-shrink-0 w-8 sm:w-12 text-center">
                  <div className="text-lg sm:text-2xl font-bold">{getRankBadge(entry.rank)}</div>
                </div>

                {/* Post Image Thumbnail */}
                <div className="flex-shrink-0">
                  <img
                    src={entry.postImage}
                    alt={`Sunset by ${entry.username}`}
                    className="w-12 h-12 sm:w-20 sm:h-20 object-cover rounded-lg"
                  />
                </div>

                {/* User Info and Stats */}
                <div className="flex-grow min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-1">
                    {/* Username */}
                    <span className="font-semibold text-gray-800 text-sm sm:text-base truncate">{entry.username}</span>
                  </div>
                  {/* Stats row */}
                  <div className="flex items-center gap-3 sm:gap-6 text-xs sm:text-sm">
                    {/* Likes */}
                    <div className="flex items-center gap-1">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 fill-current" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                      <span className="font-semibold text-gray-700">{formatLikes(entry.likes)}</span>
                    </div>
                  </div>
                </div>

                {/* Payment button for this entry */}
                <div className="flex-shrink-0 flex items-center">
                  <button
                    className="btn btn-xs sm:btn-s btn-accent text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2 h-8 sm:h-10 flex items-center justify-center"
                    onClick={() => setOpenPaymentModalId(entry.id)}
                  >
                    Vote
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Render Transact modal once, for the selected entry */}
        <Transact
          openModal={openPaymentModalId !== null}
          setModalState={() => setOpenPaymentModalId(null)}
          // Optionally pass entry info here if Transact supports it
        />
        {/* Load More Button */}
        <div className="text-center mt-8">
          <button
            onClick={handleLoadMoreClick}
            className="px-6 py-2 bg-white/20 backdrop-blur-md text-white font-medium rounded-full border border-white/30 hover:bg-white/30 transform hover:scale-105 transition-all duration-300"
          >
            Load More Posts
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-300">
          <div className="bg-white/90 backdrop-blur-md text-gray-800 px-6 py-3 rounded-lg shadow-lg border border-white/20 flex items-center gap-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
            <span className="font-medium">Coming soon!</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default Leaderboard
