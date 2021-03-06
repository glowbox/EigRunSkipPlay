//
// Boids - Flocking behavior simulation.
//
// Copyright (C) 2014 Keijiro Takahashi
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of
// this software and associated documentation files (the "Software"), to deal in
// the Software without restriction, including without limitation the rights to
// use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
// the Software, and to permit persons to whom the Software is furnished to do so,
// subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//

using UnityEngine;
using System.Collections;
using System.Collections.Generic;

public class BoidController : MonoBehaviour
{
    public GameObject boidPrefab;

    public int spawnCount = 10;

    public float spawnRadius = 4.0f;

    [Range(0.1f, 20.0f)]
    public float velocity = 6.0f;

    [Range(0.0f, 0.9f)]
    public float velocityVariation = 0.5f;

    [Range(0.1f, 20.0f)]
    public float rotationCoeff = 4.0f;

    [Range(0.1f, 10.0f)]
    public float neighborDist = 2.0f;

    public LayerMask searchLayer;

    List<BoidBehaviour> boids = new List<BoidBehaviour>();

    void Start()
    {
        for (var i = 0; i < spawnCount; i++) Spawn();
    }

    public GameObject Spawn()
    {
        Vector2 r = Random.insideUnitCircle;
        return Spawn(transform.position + new Vector3(r.x, r.y, 0) * spawnRadius);
    }

    public GameObject Spawn(Vector3 position)
    {
        var rotation = Quaternion.Slerp(transform.rotation, Quaternion.Euler(0, Random.Range(-180, 180), 0), 0.3f);
        var boid = Instantiate(boidPrefab, position, rotation) as GameObject;
        boid.layer = LayerMask.NameToLayer("Default");
        BoidBehaviour b = boid.GetComponentInChildren<BoidBehaviour>();
        b.controller = this;
        boids.Add(b);
        return boid;
    }

    public List<BoidBehaviour> GetBoidsForZone(int id)
    {
        return boids.FindAll(x => x.player.zone == id);
    }

    public BoidBehaviour Get(int id)
    {
        int found = boids.FindIndex(x => x.player.id == id);
        if( found == -1)
        {
            return null;
        }
        else
        {
            return boids[found];
        }
   }
}
