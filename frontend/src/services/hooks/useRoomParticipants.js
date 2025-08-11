import { useState } from 'react';
import { getRoomParticipants, getPlayerDetails } from '../api';

export const useRoomParticipants = (roomCode) => {
  // States
  const [showRoomParticipants, setShowRoomParticipants] = useState(false);
  const [roomParticipants, setRoomParticipants] = useState([]);
  const [isLoadingParticipants, setIsLoadingParticipants] = useState(false);
  const [selectedPlayerDetails, setSelectedPlayerDetails] = useState(null);
  const [showPlayerProfile, setShowPlayerProfile] = useState(false);
  const [isLoadingPlayerDetails, setIsLoadingPlayerDetails] = useState(false);

  // Function to fetch room participants
  const fetchRoomParticipants = async () => {
    try {
      setIsLoadingParticipants(true);
      const participants = await getRoomParticipants(roomCode);
      setRoomParticipants(participants);
    } catch (error) {
      console.error("Error fetching room participants:", error);
      // You can add error handling here (e.g., show a toast notification)
    } finally {
      setIsLoadingParticipants(false);
    }
  };

  // Function to view player profile
  const handleViewPlayerProfile = async (playerName) => {
    try {
      setIsLoadingPlayerDetails(true);
      setShowPlayerProfile(true);
      const playerDetails = await getPlayerDetails(playerName);
      console.log("player details: ", playerDetails);
      setSelectedPlayerDetails(playerDetails);
    } catch (error) {
      console.error("Error fetching player details:", error);
      // You can add error handling here
    } finally {
      setIsLoadingPlayerDetails(false);
    }
  };

  // Function to handle showing room participants
  const handleShowRoomParticipants = () => {
    setShowRoomParticipants(true);
    fetchRoomParticipants();
  };

  // Function to close room participants modal
  const closeRoomParticipants = () => {
    setShowRoomParticipants(false);
  };

  // Function to close player profile modal
  const closePlayerProfile = () => {
    setShowPlayerProfile(false);
    setSelectedPlayerDetails(null);
  };

  return {
    // States
    showRoomParticipants,
    roomParticipants,
    isLoadingParticipants,
    selectedPlayerDetails,
    showPlayerProfile,
    isLoadingPlayerDetails,
    
    // Actions
    handleShowRoomParticipants,
    fetchRoomParticipants,
    handleViewPlayerProfile,
    closeRoomParticipants,
    closePlayerProfile,
  };
};