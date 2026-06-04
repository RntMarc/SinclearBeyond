<?php

declare(strict_types=1);

namespace SinclearChat\Controllers;

use SinclearChat\Response;
use SinclearChat\Models\Room;

final class RoomController
{
    public static function list(): Response
    {
        try {
            $rooms = Room::findAll();
            return Response::success(['data' => $rooms]);
        } catch (\Throwable $e) {
            return Response::error('Failed to fetch rooms: ' . $e->getMessage(), 500);
        }
    }

    public static function show(array $params): Response
    {
        $id = $params['id'] ?? '';

        if ($id === '') {
            return Response::error('Room ID is required');
        }

        try {
            $room = Room::findById($id);

            if ($room === null) {
                return Response::notFound('Room not found');
            }

            return Response::success(['data' => $room]);
        } catch (\Throwable $e) {
            return Response::error('Failed to fetch room: ' . $e->getMessage(), 500);
        }
    }
}
