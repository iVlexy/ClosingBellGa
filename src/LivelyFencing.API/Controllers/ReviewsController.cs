using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LivelyFencing.API.Data;
using LivelyFencing.API.Domain.Entities;
using LivelyFencing.API.Infrastructure.Auth;
using LivelyFencing.API.Infrastructure.Google;

namespace LivelyFencing.API.Controllers;

[ApiController]
[Route("reviews")]
public class ReviewsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly GoogleReviewsSyncService _googleSync;
    public ReviewsController(AppDbContext db, GoogleReviewsSyncService googleSync)
    {
        _db = db;
        _googleSync = googleSync;
    }

    // Public: get approved reviews
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetApproved()
    {
        var reviews = await _db.Reviews
            .Where(r => r.Approved && !r.IsDeleted)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new {
                r.Id, r.ReviewerName, r.Rating, r.Comment, r.CreatedAt, r.Source, r.ReviewerPhotoUrl
            })
            .ToListAsync();
        return Ok(reviews);
    }

    // Public: submit a review
    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> Submit([FromBody] ReviewRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.ReviewerName) || string.IsNullOrWhiteSpace(req.Comment))
            return BadRequest("Name and comment are required.");
        if (req.Rating < 1 || req.Rating > 5)
            return BadRequest("Rating must be between 1 and 5.");

        var review = new Review
        {
            ReviewerName = req.ReviewerName.Trim(),
            ReviewerEmail = req.ReviewerEmail?.Trim(),
            Rating = req.Rating,
            Comment = req.Comment.Trim(),
            Approved = false
        };
        _db.Reviews.Add(review);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Thank you for your review! It will appear after approval." });
    }

    // Admin: list all reviews
    [HttpGet("all")]
    [Authorize(Policy = AuthorizationPolicies.AnyRole)]
    public async Task<IActionResult> GetAll()
    {
        var reviews = await _db.Reviews
            .Where(r => !r.IsDeleted)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();
        return Ok(reviews);
    }

    // Admin: approve
    [HttpPatch("{id}/approve")]
    [Authorize(Policy = AuthorizationPolicies.AnyRole)]
    public async Task<IActionResult> Approve(Guid id)
    {
        var review = await _db.Reviews.FindAsync(id);
        if (review == null) return NotFound();
        review.Approved = true;
        await _db.SaveChangesAsync();
        return Ok(review);
    }

    // Admin: delete
    [HttpDelete("{id}")]
    [Authorize(Policy = AuthorizationPolicies.AnyRole)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var review = await _db.Reviews.FindAsync(id);
        if (review == null) return NotFound();
        review.IsDeleted = true;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // Admin: sync from Google Places
    [HttpPost("sync-google")]
    [Authorize(Policy = AuthorizationPolicies.AnyRole)]
    public async Task<IActionResult> SyncGoogle()
    {
        var (imported, error) = await _googleSync.SyncAsync(_db);
        if (error != null)
            return BadRequest(new { message = error });
        return Ok(new { imported, message = imported == 0
            ? "No new reviews found."
            : $"{imported} new review{(imported == 1 ? "" : "s")} imported and awaiting approval." });
    }
}

public record ReviewRequest(string ReviewerName, string? ReviewerEmail, int Rating, string Comment);
