---
layout: ../../layouts/Docs.astro
title: Concurrency Protection
selectedNav: concurrency
---

# Concurrency Protection

## What is Concurrency?

Concurrency issues in a caching system happen when multiple requests go to a single source to request the same data. This is generally more of a problem with backend systems then frontend, however both can help to reduce overall server costs for your application and hopefully improve performance as well. 

If a request takes 1 second to fulfill from your data source and potentially 10 requests can come in within that second while you're trying to fill the cache and add additional load on the server. _see [Caching Simplified](/docs/simplified) for an example of a traditional lock_

## Why do I need Protection?
Ultimately more requests to the server(s) mean more more costs both in processing as well as actual server costs. Both the Frontend and Backend have different but similar problems they are trying to solve but both come down to reducing server load and costs.

### Frontend
In the frontend the goal of caching is generally to reduce calls to the server, this will both make the application appear faster to the user but also just reducing server calls can help reduce server load. 

With gorgon you can utilize query co-location in your components (in just about any framework) to keep your code/queries close to where they are being requested. _see [Query Collocation](/docs/collocation)_

### Backend
In the backend you want to reduce concurrency to simply reduce load on your other services. Your database most likely already has some form(s) of caching enabled but it doesn't know what is worth caching and the increased network traffic will slow your application. Specifically for concurrency if you make the same DB query multiple times to your database(s) it may not be able to use it's own cache depending on it's implementation.

For rarely changing content or heavily requested content reducing these database queries can greatly reduce your overall load and costs.

## Stopping Concurrency Issues

Gorgon solves these concurrency issues by awaiting requests with the same **key** and returning the same result to all requests once that function/promise resolves. 

Additionally by default Gorgon will assume a request is stuck after 5 seconds and retry on the next request, you can configure this in the [settings](/docs/usage/settings) or in your [policy](/docs/usage/policies)
