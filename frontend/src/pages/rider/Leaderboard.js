import React, { useState, useEffect } from 'react';
import RiderLayout from '../../components/RiderLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { reportsAPI } from '../../lib/api';
import { formatCurrency } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { Trophy, Medal, User, Loader2 } from 'lucide-react';

export default function RiderLeaderboard() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myRank, setMyRank] = useState(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await reportsAPI.getLeaderboard({});
        setLeaderboard(response.data);
        
        // Find my rank
        const myIndex = response.data.findIndex(r => r.rider_id === user?.id);
        if (myIndex !== -1) {
          setMyRank({
            rank: myIndex + 1,
            ...response.data[myIndex]
          });
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [user]);

  const getRankStyle = (index) => {
    switch(index) {
      case 0: return 'bg-yellow-400 text-yellow-900';
      case 1: return 'bg-gray-300 text-gray-700';
      case 2: return 'bg-orange-400 text-orange-900';
      default: return 'bg-gray-200 text-gray-600';
    }
  };

  const getRankIcon = (index) => {
    if (index === 0) return <Trophy className="w-5 h-5" />;
    if (index < 3) return <Medal className="w-5 h-5" />;
    return index + 1;
  };

  return (
    <RiderLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900">Leaderboard</h1>
          <p className="text-sm text-gray-500">Peringkat penjualan rider</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            {/* My Rank Card */}
            {myRank && (
              <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl ${getRankStyle(myRank.rank - 1)}`}>
                      {getRankIcon(myRank.rank - 1)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-blue-100">Peringkat Kamu</p>
                      <p className="text-2xl font-bold">#{myRank.rank}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-blue-100">Total Penjualan</p>
                      <p className="text-xl font-bold">{formatCurrency(myRank.total_sales)}</p>
                      <p className="text-xs text-blue-200">{myRank.total_transactions} transaksi</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Top 3 */}
            <div className="grid grid-cols-3 gap-2">
              {[1, 0, 2].map((position) => {
                const rider = leaderboard[position];
                if (!rider) return <div key={position} />;
                
                const isMe = rider.rider_id === user?.id;
                const height = position === 0 ? 'h-32' : position === 1 ? 'h-28' : 'h-24';
                
                return (
                  <div key={position} className={`flex flex-col items-center ${position === 0 ? '-mt-4' : ''}`}>
                    <div className={`relative ${position === 0 ? 'mb-4' : 'mb-2'}`}>
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center ${isMe ? 'ring-4 ring-blue-400' : ''} ${position === 0 ? 'bg-yellow-100' : position === 1 ? 'bg-gray-100' : 'bg-orange-100'}`}>
                        {rider.avatar_url ? (
                          <img src={rider.avatar_url} alt={rider.full_name} className="w-full h-full object-cover rounded-full" />
                        ) : (
                          <User className={`w-6 h-6 ${position === 0 ? 'text-yellow-600' : position === 1 ? 'text-gray-600' : 'text-orange-600'}`} />
                        )}
                      </div>
                      <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${getRankStyle(position)}`}>
                        {position + 1}
                      </div>
                    </div>
                    <p className="text-xs font-medium text-center truncate w-full">{rider.full_name.split(' ')[0]}</p>
                    <p className="text-xs text-gray-500">{formatCurrency(rider.total_sales)}</p>
                    <div className={`${height} w-full rounded-t-lg ${position === 0 ? 'bg-yellow-400' : position === 1 ? 'bg-gray-300' : 'bg-orange-400'} mt-2`} />
                  </div>
                );
              })}
            </div>

            {/* Full Leaderboard */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Peringkat Lengkap</CardTitle>
              </CardHeader>
              <CardContent>
                {leaderboard.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">Belum ada data</p>
                ) : (
                  <div className="space-y-2">
                    {leaderboard.map((rider, index) => {
                      const isMe = rider.rider_id === user?.id;
                      return (
                        <div
                          key={rider.rider_id}
                          className={`flex items-center gap-3 p-3 rounded-lg ${isMe ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${getRankStyle(index)}`}>
                            {index < 3 ? getRankIcon(index) : index + 1}
                          </div>
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            {rider.avatar_url ? (
                              <img src={rider.avatar_url} alt={rider.full_name} className="w-full h-full object-cover rounded-full" />
                            ) : (
                              <User className="w-4 h-4 text-gray-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {rider.full_name}
                              {isMe && <Badge className="ml-2 text-xs">Kamu</Badge>}
                            </p>
                            <p className="text-xs text-gray-500">{rider.total_transactions} transaksi</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-sm text-green-600">{formatCurrency(rider.total_sales)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </RiderLayout>
  );
}
